import data from '@/data/auctions.json';
import HomeClient from '@/components/HomeClient';

export default function Page() {
  return <HomeClient auctions={data.auctions} meta={data.meta} />;
}
