/** AsyncStorage keys — keep centralized to avoid typos */

/** Once per user after login — intro not shown again for that account. */
export function postLoginIntroSeenKey(userId) {
  if (!userId) {
    return '@connectiqo/post_login_intro/_';
  }
  return `@connectiqo/post_login_intro/${userId}`;
}
