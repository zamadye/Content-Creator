export const compositionId = (dir) =>
  'Studio' +
  dir
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
