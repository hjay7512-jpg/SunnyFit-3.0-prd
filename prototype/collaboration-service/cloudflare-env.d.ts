declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    COLLAB_ADMIN_KEY?: string;
    COLLAB_ALLOWED_ORIGINS?: string;
    BUCKET?: R2Bucket;
  }
}
