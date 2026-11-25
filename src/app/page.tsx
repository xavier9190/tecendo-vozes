import { getLocais } from "@/lib/data/locais";
import { MapShell } from "@/components/map/MapShell";

export default function HomePage() {
  const locais = getLocais();

  return <MapShell places={locais} />;
}
