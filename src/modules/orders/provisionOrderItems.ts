// src/modules/orders/provisionOrderItems.ts
//
// Shared by both paystackWebhook (the primary path) and verifyPayment
// (the fallback path for when the webhook hasn't fired yet — e.g. local
// dev without a tunnel, or a delayed webhook in production). Keeping
// this logic in ONE place means both paths can never drift apart.

import { prisma } from "../../lib/prisma";
import { registerDomainWithOpenProvider, updateDomainNameservers } from "../../lib/openProvider";
import whmClient, { createDnsZone } from "../../lib/whm";
import { generateCpanelUsername } from "../../utils/utils";
import crypto from "crypto";

export async function provisionOrderItems(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { plan: true } }, user: true },
  });

  if (!order) return;

  for (const item of order.items) {
    // Skip items that are already provisioned — makes this function safe
    // to call multiple times for the same order without double-creating things
    const alreadyDone =
      (await prisma.hostingAccount.findUnique({
        where: { orderItemId: item.id },
      })) ??
      (await prisma.domain.findUnique({ where: { orderItemId: item.id } }));
    if (alreadyDone) continue;

    try {
      if (item.type === "HOSTING" && item.plan) {
        const cpanelUsername = generateCpanelUsername(
          order.user.firstName,
          order.user.lastName,
        );
        const cpanelPassword =
          crypto.randomBytes(12).toString("base64").slice(0, 12) + "A1!";

        const whmResponse = await whmClient.get("/json-api/createacct", {
          params: {
            "api.version": 1,
            username: cpanelUsername,
            domain: item.domainName ?? `${cpanelUsername}.nupatcloud.com`,
            password: cpanelPassword,
            plan: item.plan.name,
            contactemail: order.user.email,
            maxsub: item.plan.emails,
            quota: item.plan.storage.replace(/[^0-9]/g, ""),
          },
        });

        if (whmResponse.data.metadata.result === 1) {
          await prisma.hostingAccount.create({
            data: {
              userId: order.userId,
              planId: item.plan.id,
              cpanelUsername,
              domain: item.domainName ?? `${cpanelUsername}.nupatcloud.com`,
              serverIp: process.env.WHM_HOST!,
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              orderItemId: item.id,
            },
          });
        } else {
          console.error(
            `Hosting provisioning failed for order item ${item.id}:`,
            whmResponse.data,
          );
        }
      }

      if (item.type === "DOMAIN" && item.domainName) {
        const [name, ...extParts] = item.domainName.split(".");
        const extension = extParts.join(".");

        const ownerHandle = order.user.openproviderHandle;
        if (!ownerHandle) {
          console.error(
            `No OpenProvider handle for user ${order.userId} — cannot register ${item.domainName}`,
          );
          continue;
        }

        // Step 1: register the domain — by default this points at
        // OpenProvider's own parking nameservers
        const result = await registerDomainWithOpenProvider({
          domainName: name,
          extension,
          ownerHandle,
        });

        // Step 2: point the domain's nameservers at OUR server, not OpenProvider's
        // default ones, so it can actually serve content from our hosting
        try {
          await updateDomainNameservers(result.openproviderId, [
            "ns1.nupatcloud.com",
            "ns2.nupatcloud.com",
          ]);
        } catch (nsError) {
          // Don't let a nameserver-update failure undo the registration —
          // the domain still exists and is owned by the customer, it just
          // needs the nameservers fixed manually if this step fails
          console.error(
            `Nameserver update failed for ${item.domainName}:`,
            nsError,
          );
        }

        // Step 3: create the actual DNS zone on WHM, so ns1/ns2.nupatcloud.com
        // know how to answer for this domain once the registry change propagates
        try {
          await createDnsZone(item.domainName, process.env.WHM_HOST!);
        } catch (dnsError) {
          console.error(
            `WHM DNS zone creation failed for ${item.domainName}:`,
            dnsError,
          );
        }

        await prisma.domain.create({
          data: {
            userId: order.userId,
            name: item.domainName,
            extension,
            openproviderId: result.openproviderId,
            authCode: result.authCode,
            status: result.status === "ACT" ? "ACTIVE" : "PENDING",
            nameservers: ["ns1.nupatcloud.com", "ns2.nupatcloud.com"],
            registeredAt: new Date(result.activationDate),
            expiresAt: new Date(result.expirationDate),
            orderItemId: item.id,
          },
        });
      }

      if (item.type === "SSL" && item.domainName) {
        console.log(
          `SSL provisioning not yet implemented for ${item.domainName}`,
        );
      }
    } catch (itemError) {
      console.error(
        `Failed to provision order item ${item.id} (${item.type}):`,
        itemError,
      );
    }
  }
}
