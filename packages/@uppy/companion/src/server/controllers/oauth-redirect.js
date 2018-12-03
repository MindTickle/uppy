const qs = require("querystring");
const parseUrl = require("url").parse;
const { hasMatch } = require("../helpers/utils");
const oAuthState = require("../helpers/oauth-state");

/**
 *
 * @param {object} req
 * @param {object} res
 */
module.exports = function oauthRedirect(req, res) {
  if (!req.query.state) {
    return res.status(400).send("Cannot find state param in reques");
  }
  const handler = oAuthState.getFromState(req.query.state, "uppyInstance", req.uppy.options.secret);
  const handlerHostName = parseUrl(handler).host;

  if (hasMatch(handlerHostName, req.uppy.options.server.validHosts)) {
    const providerName = req.uppy.provider.authProvider;
    const params = qs.stringify(req.query);

    const url = `${handler}/connect/${providerName}/callback?${params}`;
    if (req.session) {
      req.session.save(function(err) {
        if (err) console.error(err);
        _finish(url);
      });
    } else {
      _finish(url);
    }

    function _finish(path) {
      return res.redirect(path);
    }
  }

  res.status(400).send("Invalid Host in state");
};
