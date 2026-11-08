<?php
/**
 * TagKit theme setup: loads TagBrush.css, the WordPress compatibility styles,
 * and, only on pages that use it, TagAction.
 *
 * @package TagKit
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'tagkit_setup' ) ) {
	/**
	 * The editor uses the same styles as the site.
	 */
	function tagkit_setup() {
		add_editor_style( array( 'assets/css/tagbrush.min.css', 'assets/css/wordpress.css' ) );
	}
}
add_action( 'after_setup_theme', 'tagkit_setup' );

if ( ! function_exists( 'tagkit_asset_suffix' ) ) {
	/**
	 * Readable files when SCRIPT_DEBUG is on, minified ones otherwise.
	 *
	 * @return string
	 */
	function tagkit_asset_suffix() {
		return ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
	}
}

if ( ! function_exists( 'tagkit_needs_tagaction' ) ) {
	/**
	 * Whether the current page has something TagAction enhances: code, tables,
	 * details, abbreviations, times, forms, or a comment form.
	 *
	 * @return bool
	 */
	function tagkit_needs_tagaction() {
		$needs = false;
		if ( is_singular() ) {
			$content = (string) get_post_field( 'post_content', get_queried_object_id() );
			$needs   = (bool) preg_match( '/<(pre|table|details|abbr|time|dialog|output|template|form)\b|type="(password|file)"/i', $content )
				|| comments_open( get_queried_object_id() );
		}
		/**
		 * Filters whether TagAction is loaded on the current page.
		 *
		 * @param bool $needs True when the page has content TagAction enhances.
		 */
		return (bool) apply_filters( 'tagkit_load_tagaction', $needs );
	}
}

if ( ! function_exists( 'tagkit_enqueue_assets' ) ) {
	/**
	 * Loads the styles everywhere and TagAction where it's needed.
	 */
	function tagkit_enqueue_assets() {
		$suffix  = tagkit_asset_suffix();
		$version = wp_get_theme()->get( 'Version' );

		wp_enqueue_style( 'tagkit-tagbrush', get_theme_file_uri( "assets/css/tagbrush{$suffix}.css" ), array(), '1.2.0' );
		wp_enqueue_style( 'tagkit', get_theme_file_uri( 'assets/css/wordpress.css' ), array( 'tagkit-tagbrush' ), $version );

		if ( tagkit_needs_tagaction() ) {
			wp_enqueue_script(
				'tagkit-tagaction',
				get_theme_file_uri( "assets/js/tagaction{$suffix}.js" ),
				array(),
				'0.1.0',
				array(
					'strategy'  => 'defer',
					'in_footer' => false,
				)
			);
		}
	}
}
add_action( 'wp_enqueue_scripts', 'tagkit_enqueue_assets' );

if ( ! function_exists( 'tagkit_front_page_template' ) ) {
	/**
	 * The front-page template shows a page's content without its title. When
	 * the front page lists the latest posts instead, the posts list is used.
	 *
	 * @param string[] $templates Template names WordPress looks for, in order.
	 * @return string[]
	 */
	function tagkit_front_page_template( $templates ) {
		return 'page' === get_option( 'show_on_front' ) ? $templates : array();
	}
}
add_filter( 'frontpage_template_hierarchy', 'tagkit_front_page_template' );

if ( ! function_exists( 'tagkit_register_block_styles' ) ) {
	/**
	 * Card styles for columns and groups, picked in the editor's Styles panel:
	 * a boxed panel (pricing plans, features), and a featured one that stands out.
	 * Their look is in assets/css/wordpress.css.
	 */
	function tagkit_register_block_styles() {
		foreach ( array( 'core/column', 'core/group' ) as $block ) {
			register_block_style(
				$block,
				array(
					'name'  => 'card',
					'label' => __( 'Card', 'tagkit' ),
				)
			);
			register_block_style(
				$block,
				array(
					'name'  => 'card-featured',
					'label' => __( 'Featured card', 'tagkit' ),
				)
			);
		}
	}
}
add_action( 'init', 'tagkit_register_block_styles' );
