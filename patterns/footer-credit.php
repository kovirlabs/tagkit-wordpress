<?php
/**
 * Title: Footer credit
 * Slug: tagkit/footer-credit
 * Inserter: no
 *
 * @package TagKit
 */

?>
<!-- wp:paragraph -->
<p>
<?php
printf(
	/* translators: 1: WordPress, 2: TagKit */
	esc_html__( 'Built with %1$s and %2$s', 'tagkit' ),
	'<a href="' . esc_url( __( 'https://wordpress.org', 'tagkit' ) ) . '">WordPress</a>',
	'<a href="https://github.com/kovirlabs/tagkit-wordpress">TagKit</a>'
);
?>
</p>
<!-- /wp:paragraph -->
