import type { User } from "../services";

export class AppState {
  user: User | null;
  isPreview: boolean;
  selectedPostSlug: string | null = null;

  constructor(user: User | null = null, isPreview = false) {
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
