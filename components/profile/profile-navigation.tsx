import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning"

interface ProfileNavigationProps {
  activeTab: string
  userId: string
  hasUnsavedChanges?: boolean
}

export function ProfileNavigation({ activeTab, userId, hasUnsavedChanges = false }: ProfileNavigationProps) {
  // Usar el hook para advertir sobre cambios sin guardar
  useUnsavedChangesWarning(hasUnsavedChanges)

  return (
    <nav>
      <ul>
        <li>
          <a href={`/profile/${userId}`} className={activeTab === "profile" ? "active" : ""}>
            Profile
          </a>
        </li>
        <li>
          <a href={`/profile/${userId}/settings`} className={activeTab === "settings" ? "active" : ""}>
            Settings
          </a>
        </li>
      </ul>
    </nav>
  )
}
