#!/bin/sh
# Installs the demo WordPress, activates TagKit, and adds a few realistic
# posts, a page, and featured images. Safe to run again.
set -e
cd "$(dirname "$0")"
wp() { docker compose exec -T cli wp "$@"; }
until wp db check >/dev/null 2>&1; do sleep 2; done
if ! wp core is-installed 2>/dev/null; then
  wp core install --url=http://localhost:8890 --title="Field Notes" --admin_user=admin --admin_password=admin --admin_email=admin@example.com --skip-email
fi
wp option update blogdescription "Short essays on running a tiny software business." >/dev/null
wp theme activate tagkit >/dev/null
wp user update admin --display_name="Dana Whitfield" --first_name=Dana --last_name=Whitfield >/dev/null
wp rewrite structure '/%postname%/' >/dev/null
docker compose exec -T -u 0 wordpress sh -c 'printf "%s\n" "# BEGIN WordPress" "RewriteEngine On" "RewriteBase /" "RewriteRule ^index\.php$ - [L]" "RewriteCond %{REQUEST_FILENAME} !-f" "RewriteCond %{REQUEST_FILENAME} !-d" "RewriteRule . /index.php [L]" "# END WordPress" > /var/www/html/.htaccess'

if [ "$(wp post list --post_type=post --format=count)" -le 1 ]; then
  wp post delete 1 --force >/dev/null 2>&1 || true
  wp post delete 2 --force >/dev/null 2>&1 || true
  post() { # title, file, date, image id
    id=$(wp post create "/content/$2" --post_title="$1" --post_status=publish --post_date="$3" --post_author=1 --porcelain)
    wp media import "https://picsum.photos/id/$4/1600/900.jpg" --post_id="$id" --featured_image --title="$1" --alt="" >/dev/null 2>&1 || echo "  (no featured image for: $1)"
  }
  post "Why I price by the day" pricing-by-the-day.html "2026-09-30 09:00:00" 1060
  post "Plain HTML ages well" plain-html.html "2026-10-14 09:00:00" 1043
  post "What I learned running a tiny SaaS for a year" a-year-of-saas.html "2026-11-02 09:00:00" 180
  wp post create /content/about.html --post_type=page --post_title="About" --post_status=publish --post_name=about >/dev/null
  wp comment create --comment_post_ID="$(wp post list --post_type=post --name=what-i-learned-running-a-tiny-saas-for-a-year --field=ID)" --comment_content="The point about charging from day one hit home. Thanks for writing this up." --comment_author="Sam Ito" --comment_approved=1 >/dev/null
fi
echo "Demo site: http://localhost:8890  (admin: http://localhost:8890/wp-admin, admin / admin)"
