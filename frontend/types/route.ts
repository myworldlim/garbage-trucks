export interface Route {
  id: number;
  order_number: number;
  scheduled_at: string;
  status: string;
  point: {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
  };
}