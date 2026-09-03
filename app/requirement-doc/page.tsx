import { redirect } from 'next/navigation'
import { originalPlanRoute } from '@/lib/shared'

/** The original plan moved to `/original-plan` when the four tabs landed. Old links still work. */
export default function RequirementDocRedirect() {
  redirect(originalPlanRoute)
}
