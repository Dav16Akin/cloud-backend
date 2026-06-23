import { User } from "../generated/prisma";

export const toSafeUser = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  companyName: user.companyName,
  houseNumber: user.houseNumber,
  state: user.state,
  address: user.address,
  country: user.country,
  city: user.city,
  postcode: user.postcode,
  verified: user.verified,
  createdAt: user.createdAt,
});
