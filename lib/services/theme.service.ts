// Theme model removed from Prisma schema.
// All event design is now managed via EventWizard on the Invitation model.
// This file is kept as an empty stub to avoid import errors in files not yet cleaned up.

export class ThemeService {
  static async getAllThemes() { return []; }
  static async getThemesForPackage(_packageId: string) { return []; }
  static async setThemesForPackage(_packageId: string, _themeIds: string[]) { return; }
}
