import type { Scrap } from '../model/Scrap';

export function generateScrap(
  id: string,
  title: string,
  type: string = 'file',
  order: number,
): Scrap {
  return {
    id: id,
    type: type,
    title,
    order,
  };
}
