// oauth configuration for provider services that are used.
module.exports = (state = "") => {
  return {
    google: {
      scope: ["https://www.googleapis.com/auth/drive.readonly"],
      callback: `/drive/callback?state=${state}`
    },
    dropbox: {
      authorize_url: "https://www.dropbox.com/oauth2/authorize",
      access_url: "https://api.dropbox.com/oauth2/token",
      callback: "/dropbox/callback"
    },
    instagram: {
      callback: "/instagram/callback"
    }
  };
};
