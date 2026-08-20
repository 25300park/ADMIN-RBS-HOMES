import { redirect } from 'next/navigation'
import { ROUTES } from '@/utils/constants'

export default function TimeManagementPage() {
  redirect(ROUTES.TIME_PENDING)
}
