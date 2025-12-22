export default function ReadOnlyAlert() {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
      <p className="text-sm text-yellow-800 dark:text-yellow-300">
        <strong>Read-only mode:</strong> User lacks the required <code>plant-admin</code> role. Please sign in with a permitted account to enable editing.
      </p>
    </div>
  );
}

