export const CITABOX_DATA_CHANGED_EVENT = "citabox:data-changed"

export type DataChangedDetail = {
  entity: "appointment" | "patient"
  action: "created" | "updated" | "deleted"
}

export function emitDataChanged(detail: DataChangedDetail) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CITABOX_DATA_CHANGED_EVENT, { detail }))
}
