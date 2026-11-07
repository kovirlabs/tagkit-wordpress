#!/bin/sh
# Installs WordPress, activates the theme, and imports the WordPress Theme
# Unit Test content (the posts the theme directory reviews with).
set -e
cd "$(dirname "$0")"
wp() { docker compose exec -T cli wp "$@"; }
until wp db check >/dev/null 2>&1; do sleep 2; done
wp core is-installed 2>/dev/null || wp core install --url=http://localhost:8888 --title="TagKit" --admin_user=admin --admin_password=admin --admin_email=admin@example.com --skip-email
wp option update blogdescription "A plain, fast, accessible block theme."
wp theme activate tagkit
wp rewrite structure '/%postname%/' --hard >/dev/null
if [ "$(wp post list --post_type=post --format=count)" -lt 10 ]; then
  wp plugin install wordpress-importer --activate --quiet
  docker compose exec -T cli sh -c 'curl -sfL https://raw.githubusercontent.com/WordPress/theme-test-data/master/themeunittestdata.wordpress.xml -o /tmp/unit.xml'
  wp import /tmp/unit.xml --authors=create --quiet
fi
wp plugin install theme-check --activate --quiet || true
echo "WordPress is ready at http://localhost:8888 (admin / admin)"
