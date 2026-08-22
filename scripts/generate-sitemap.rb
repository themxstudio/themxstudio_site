#!/usr/bin/env ruby
# frozen_string_literal: true

require "cgi"
require "set"
require "uri"

BASE_URL = "https://www.themxstudio.com.au"
SITE_HOST = URI(BASE_URL).host
ROOT_DIR = File.expand_path("..", __dir__)
SITEMAP_PATH = File.join(ROOT_DIR, "sitemap.xml")
IMAGE_EXTENSIONS = %w[.avif .gif .jpg .jpeg .png .svg .webp].freeze
ATTRIBUTES_REGEX = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*(["'])(.*?)\2/m

EXACT_METADATA = {
  "/" => { changefreq: "weekly", priority: "1.0" },
  "/about/" => { changefreq: "monthly", priority: "0.6" },
  "/blog/" => { changefreq: "weekly", priority: "0.7" },
  "/book-a-call/" => { changefreq: "monthly", priority: "0.7" },
  "/contact/" => { changefreq: "monthly", priority: "0.7" },
  "/locations/" => { changefreq: "monthly", priority: "0.6" },
  "/pricing/" => { changefreq: "monthly", priority: "0.8" },
  "/results/" => { changefreq: "monthly", priority: "0.7" },
  "/terms/" => { changefreq: "yearly", priority: "0.2" },
  "/websites-for-brisbane-businesses/" => {
    changefreq: "monthly",
    priority: "0.7",
  },
}.freeze

PATTERN_METADATA = [
  [%r{\A/blog/[^/]+/\z}, { changefreq: "monthly", priority: "0.6" }],
  [%r{\A/locations/[^/]+/\z}, { changefreq: "monthly", priority: "0.6" }],
  [%r{\A/results/[^/]+/\z}, { changefreq: "monthly", priority: "0.5" }],
  [
    %r{\A/services/web-hosting-and-maintenance-brisbane/\z},
    { changefreq: "monthly", priority: "0.7" },
  ],
  [%r{\A/services/[^/]+/\z}, { changefreq: "monthly", priority: "0.8" }],
].freeze

DEFAULT_METADATA = { changefreq: "monthly", priority: "0.6" }.freeze

def html_tags(html, tag_name)
  html.scan(%r{<#{tag_name}\b[^>]*>}im)
end

def parse_attributes(tag)
  tag.scan(ATTRIBUTES_REGEX).each_with_object({}) do |(name, _quote, value), memo|
    memo[name.downcase] = CGI.unescapeHTML(value)
  end
end

def noindex?(html)
  html_tags(html, "meta").any? do |tag|
    attrs = parse_attributes(tag)
    next false unless %w[robots googlebot].include?(attrs["name"]&.downcase)

    attrs["content"].to_s.downcase.include?("noindex")
  end
end

def file_to_path(file)
  return "/" if file == "index.html"
  return "/404.html" if file == "404.html"

  if file.end_with?("/index.html")
    "/#{file.sub(%r{/index\.html\z}, "/")}"
  else
    "/#{file}"
  end
end

def absolute_url(value, base_url)
  return nil if value.nil?

  raw = CGI.unescapeHTML(value).strip
  return nil if raw.empty?
  return nil if raw.start_with?("data:", "blob:", "javascript:")

  uri = URI.parse(raw)
  uri = URI.join(base_url, raw) unless uri.scheme
  return nil unless %w[http https].include?(uri.scheme)

  uri.fragment = nil
  uri.to_s
rescue URI::InvalidURIError
  nil
end

def image_url?(url)
  return false unless url

  uri = URI.parse(url)
  return false unless uri.host == SITE_HOST

  IMAGE_EXTENSIONS.include?(File.extname(uri.path).downcase)
rescue URI::InvalidURIError
  false
end

def extract_canonical_url(html, file)
  fallback = "#{BASE_URL}#{file_to_path(file)}"

  html_tags(html, "link").each do |tag|
    attrs = parse_attributes(tag)
    next unless attrs["rel"]&.downcase == "canonical"

    canonical = absolute_url(attrs["href"], fallback)
    return canonical if canonical
  end

  fallback
end

def srcset_candidates(value)
  return [] if value.to_s.strip.empty?

  value.split(",").map do |entry|
    entry.strip.split(/\s+/, 2).first
  end.compact
end

def extract_images(html, page_url)
  images = Set.new
  decoded_html = CGI.unescapeHTML(html)

  html_tags(html, "meta").each do |tag|
    attrs = parse_attributes(tag)
    if attrs["property"]&.downcase == "og:image"
      image_url = absolute_url(attrs["content"], page_url)
      images << image_url if image_url?(image_url)
    end

    if attrs["name"]&.downcase == "twitter:image"
      image_url = absolute_url(attrs["content"], page_url)
      images << image_url if image_url?(image_url)
    end
  end

  %w[img source].each do |tag_name|
    html_tags(html, tag_name).each do |tag|
      attrs = parse_attributes(tag)
      image_url = absolute_url(attrs["src"], page_url)
      images << image_url if image_url?(image_url)

      srcset_candidates(attrs["srcset"]).each do |candidate|
        srcset_url = absolute_url(candidate, page_url)
        images << srcset_url if image_url?(srcset_url)
      end
    end
  end

  html_tags(html, "link").each do |tag|
    attrs = parse_attributes(tag)
    next unless attrs["as"]&.downcase == "image"

    image_url = absolute_url(attrs["href"], page_url)
    images << image_url if image_url?(image_url)
  end

  decoded_html.scan(%r{url\(([^)]+)\)}i).flatten.each do |match|
    candidate = match.strip.gsub(/\A["']|["']\z/, "")
    image_url = absolute_url(candidate, page_url)
    images << image_url if image_url?(image_url)
  end

  images.to_a.sort
end

def metadata_for(path)
  exact = EXACT_METADATA[path]
  return exact if exact

  PATTERN_METADATA.each do |pattern, metadata|
    return metadata if pattern.match?(path)
  end

  DEFAULT_METADATA
end

def xml_escape(value)
  CGI.escapeHTML(value.to_s)
end

pages_by_loc = {}

Dir.glob("**/*.html", base: ROOT_DIR).reject { |file| file.start_with?(".") }.sort.each do |file|
  html = File.read(File.join(ROOT_DIR, file))
  next if noindex?(html)

  loc = extract_canonical_url(html, file)
  path = URI.parse(loc).path
  path = "/" if path.nil? || path.empty?
  entry = pages_by_loc[loc]

  if entry
    entry[:images].merge(extract_images(html, loc))
    next
  end

  pages_by_loc[loc] = {
    loc: loc,
    path: path,
    metadata: metadata_for(path),
    images: Set.new(extract_images(html, loc)),
  }
end

pages = pages_by_loc.values

pages.sort_by! do |page|
  page[:path] == "/" ? "" : page[:path]
end

xml_lines = []
xml_lines << %(<?xml version="1.0" encoding="UTF-8"?>)
xml_lines << %(<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">)
xml_lines << ""

pages.each_with_index do |page, index|
  xml_lines << "  <url>"
  xml_lines << "    <loc>#{xml_escape(page[:loc])}</loc>"
  xml_lines << "    <changefreq>#{page[:metadata][:changefreq]}</changefreq>"
  xml_lines << "    <priority>#{page[:metadata][:priority]}</priority>"

  page[:images].to_a.sort.each do |image|
    xml_lines << "    <image:image>"
    xml_lines << "      <image:loc>#{xml_escape(image)}</image:loc>"
    xml_lines << "    </image:image>"
  end

  xml_lines << "  </url>"
  xml_lines << "" unless index == pages.length - 1
end

xml_lines << "</urlset>"
xml_lines << ""

File.write(SITEMAP_PATH, xml_lines.join("\n"))

image_count = pages.sum { |page| page[:images].length }
puts "Generated #{SITEMAP_PATH} with #{pages.length} pages and #{image_count} image entries."
