// Planned contracts can be enabled individually after backend deployment.
export const previewMode =
  import.meta.env.DEV && import.meta.env.VITE_PREVIEW_MODE === "true";
const enabled = new Set(
  (import.meta.env.VITE_ENABLED_FEATURES ?? "")
    .split(",")
    .map((s: string) => s.trim()),
);
const planned = (name: string) => previewMode || enabled.has(name);
export const capabilities = {
  profileDiscovery: planned("profileDiscovery"),
  meetings: true,
  communities: planned("communities"),
  reviews: planned("reviews"),
  chatDetails: planned("chatDetails"),
  chatSchedule: planned("chatSchedule"),
  chatReports: planned("chatReports"),
  support: planned("support"),
  account: planned("account"),
};
export function requireCapability(name: keyof typeof capabilities) {
  if (!capabilities[name])
    throw new Error("서버 연결을 준비하고 있어요. 잠시 후 다시 이용해주세요.");
}
