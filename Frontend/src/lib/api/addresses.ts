import { getAuthJson, requestAuthJson } from "@/lib/api";

export type SavedAddress = {
  _id: string;
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

export async function fetchAddresses(token: string): Promise<SavedAddress[]> {
  return getAuthJson<SavedAddress[]>("/api/addresses", token);
}

export async function createAddress(
  token: string,
  body: Omit<SavedAddress, "_id">,
): Promise<SavedAddress> {
  return requestAuthJson<SavedAddress>("/api/addresses", token, {
    method: "POST",
    body: {
      label: body.label ?? "",
      fullName: body.fullName,
      phone: body.phone,
      line1: body.line1,
      line2: body.line2 ?? "",
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country ?? "India",
    },
  });
}

export async function deleteAddress(token: string, addressId: string): Promise<void> {
  await requestAuthJson(`/api/addresses/${encodeURIComponent(addressId)}`, token, {
    method: "DELETE",
  });
}
