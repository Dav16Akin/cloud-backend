// generates a unique cpanel username from the user's name
// cPanel usernames must be max 8 chars, lowercase, alphanumeric

export const generateCpanelUsername = (
  firstName: string,
  lastName: string,
): string => {
  const base = `${firstName}${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base.slice(0, 4)}${random}`; // e.g. "john1234"
};

export const parseDiskValue = (value: string): string => {
  if (value === "unlimited") return "unlimited";

  // WHM returns values like "2M", "10M", "50M"
  // M here means MB * 1024 (it's actually in MB)
  const num = parseFloat(value);
  if (value.endsWith("M")) return `${num * 1024} MB`;
  if (value.endsWith("G")) return `${num * 1024} GB`;
  return value;
};