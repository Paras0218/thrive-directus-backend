# Production image for Render.
# Extends the official Directus image and bakes in the schema snapshot so the
# database schema is applied automatically on every deploy (schema-as-code).
#
# NOTE: keep this tag in sync with the "directus" version in package.json and
# the Directus version that generated snapshot.yaml — a mismatch can make
# `schema apply` reject the snapshot.
FROM directus/directus:11.17.4

# Schema snapshot is committed to the repo and copied into the image.
COPY snapshot.yaml /directus/snapshot.yaml

# The base image's default command is:
#   node cli.js bootstrap && pm2-runtime start ecosystem.config.cjs
# We insert `schema apply` between bootstrap (runs migrations + creates the
# first admin) and start. `schema apply` is idempotent — on boots with no schema
# diff it's a no-op, so it's safe to run on every deploy.
CMD ["sh", "-c", "node cli.js bootstrap && node cli.js schema apply --yes /directus/snapshot.yaml && pm2-runtime start ecosystem.config.cjs"]
