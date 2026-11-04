/**
 * Median of a list of numbers. Used for weigh-ins: a single bad scale day
 * (weighed after a big meal, different scale) must not drag the weekly
 * weight the way a mean lets it. Returns null when no finite number exists.
 */
export function medianOfNumbers(values) {
  const nums = (Array.isArray(values) ? values : [])
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 1 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}
