import contract from '@/design-system/tokens.json'
import type { AppointmentStatus } from '@/types/api'

export const appointmentState = contract.appointmentStates
export function appointmentStatusClass(status: AppointmentStatus) {
  return `status-${appointmentState[status].tone}`
}
export function appointmentStatusLabel(status: AppointmentStatus) {
  return appointmentState[status].label
}
export function appointmentStatusColor(status: AppointmentStatus) {
  return `var(--ds-${appointmentState[status].tone})`
}
