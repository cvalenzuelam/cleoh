export type ShippingMethodPublic = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  etaLabel: string | null;
};

export type ShippingAddress = {
  street: string;
  exterior: string;
  interior?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  methodId: string;
  methodName: string;
};
