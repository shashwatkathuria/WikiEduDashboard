# frozen_string_literal: true

require 'mediawiki_api'
require 'json'
require_dependency "#{Rails.root}/lib/article_rating_extractor.rb"
require_dependency "#{Rails.root}/lib/errors/error_handling"

#= This class is for getting data directly from the MediaWiki API.
class WikiApi
  include ErrorHandling

  def initialize(wiki = nil, course = nil)
    wiki ||= Wiki.default_wiki
    @api_url = wiki.api_url
    @course = course
  end

  ################
  # Entry points #
  ################

  # General entry point for making arbitrary queries of a MediaWiki wiki's API
  def query(query_parameters)
    mediawiki('query', query_parameters)
  end

  # Returns nil if it cannot get any info from the wiki, but returns
  # empty string if it's a 404 because the page is a redlink.
  def get_page_content(page_title)
    response = mediawiki('get_wikitext', page_title)
    case response&.status
    when 200
      response.body.force_encoding('UTF-8')
    when 404
      ''
    end
  end

  def get_user_id(username)
    info = get_user_info(username)
    return unless info
    info['userid']
  end

  def get_user_info(username)
    user_query = { list: 'users',
                   ususers: username,
                   usprop: 'centralids|registration' }
    user_data = mediawiki('query', user_query)
    return unless user_data.data['users'].any?
    user_data.data['users'][0]
  end

  def redirect?(page_title)
    response = get_page_info([page_title])
    return false if response.nil?
    redirect = response['pages']&.values&.dig(0, 'redirect')
    redirect ? true : false
  end

  def get_page_info(titles)
    query_params = { prop: 'info',
                     titles: titles }
    response = query(query_params)
    response&.status == 200 ? response.data : nil
  end

  def get_article_rating(titles)
    titles = [titles] unless titles.is_a?(Array)
    titles = titles.sort_by(&:downcase)

    query_parameters = { titles: titles,
                         prop: 'pageassessments',
                         redirects: 'true' }
    response = fetch_all(query_parameters)
    pages = response['pages']
    ArticleRatingExtractor.new(pages).ratings
  end

  ###################
  # Private methods #
  ###################
  private

  def fetch_all(query)
    @query = query
    @data = {}
    until @continue == 'done'
      @query.merge! @continue unless @continue.nil?
      response = mediawiki('query', @query)
      return @data unless response # fall back gracefully if the query fails
      @data.deep_merge! response.data
      # The 'continue' value is nil if the batch is complete
      @continue = response['continue'] || 'done'
    end

    @data
  end

  def mediawiki(action, query)
    tries ||= 3
    @mediawiki = api_client
    @mediawiki.send(action, query)
  rescue StandardError => e
    tries -= 1
    # Raise unknown errors.
    # Continue for typical errors so that the request can be retried, but wait
    # a short bit in the case of 429 — too many request — errors.
    sleep 1 if too_many_requests?(e)
    retry unless tries.zero?
    invoke_error_handling(e, action, query)
    raise_unexpected_error(e, TYPICAL_ERRORS)
    return nil
  end

  def api_client
    MediawikiApi::Client.new @api_url
  end

  def too_many_requests?(e)
    return false unless e.class == MediawikiApi::HttpError
    e.status == 429
  end

  TYPICAL_ERRORS = [Faraday::TimeoutError,
                    Faraday::ConnectionFailed,
                    MediawikiApi::HttpError,
                    MediawikiApi::ApiError].freeze

  def invoke_error_handling(error, action, query)
    extra = { action: action, query: query, api_url: @api_url }
    optional_params = { miscellaneous: { action: action, query: query } }
    perform_error_handling(error, TYPICAL_ERRORS, extra, @course, optional_params)
  end
end
