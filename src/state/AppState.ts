import type { Services, User } from "../services";

export class AppState {
  private services: Services;
  user: User | null;
  isPreview: boolean;
  selectedPostSlug: string | null = null;

  constructor(services: Services, user: User | null = null, isPreview = false) {
    this.services = services;
    this.user = user;
    this.isPreview = isPreview;
  }

  selectPost(slug: string) {
    this.selectedPostSlug = slug;
  }

  goBack() {
    this.selectedPostSlug = null;
  }

  signOut() {
    fetch('/auth/logout', { method: 'POST' }).then(() => {
      window.location.href = '/';
    });
  }
}
