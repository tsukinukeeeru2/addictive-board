import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export function relativeTime(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ja });
}
