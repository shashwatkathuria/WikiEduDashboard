# frozen_string_literal: true
# == Schema Information
#
# Table name: training_slides
#
#  id              :bigint(8)        not null, primary key
#  name            :string(255)
#  estimated_ttc   :string(255)
#  wiki_page       :string(255)
#  slide_slugs     :text(65535)
#  description     :text(65535)
#  slug            :string(255)
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

require_dependency "#{Rails.root}/lib/training/training_base"
require_dependency "#{Rails.root}/lib/training_library"

#= Class representing an individual training module
class TrainingModule < ApplicationRecord
  attr_accessor :status
  serialize :slide_slugs, Array

  validates :id, uniqueness: true
  validates :slug, uniqueness: true

  def self.path_to_yaml
    "#{base_path}/modules/*.yml"
  end

  def self.wiki_base_page
    ENV['training_modules_wiki_page']
  end

  def self.trim_id_from_filename
    false
  end

  def self.load
    TrainingBase.load(content_class: self)
  end

  def self.base_path
    TrainingBase.base_path
  end

  def self.load_all
    TrainingBase.load_all
  end

  def self.flush
    delete_all
  end

  # This reloads all the library and module content, but only updates the slides
  # for the module with the given slug.
  def self.reload_module(slug:)
    # First reload the libraries and modules so we have the new list of slugs
    # and can load slides for brand-new modules.
    TrainingLibrary.flush
    TrainingModule.flush
    TrainingLibrary.load
    TrainingModule.load
    # Reload the requested module's slides
    training_module = TrainingModule.find_by(slug: slug)
    raise ModuleNotFound, "No module #{slug} found!" unless training_module
    TrainingSlide.load(slug_list: training_module.slide_slugs)

    # After updating the module's slides, we must flush and update the module
    # cache again so that it includes the updated slides.
    TrainingModule.flush
    TrainingModule.load
  end

  def self.inflate(content, slug, wiki_page = nil) # rubocop:disable Metrics/MethodLength
    training_module = TrainingModule.new
    training_module.id = content['id']
    training_module.slug = slug
    training_module.name = content['name']
    training_module.description = content['description']
    training_module.estimated_ttc = content['estimated_ttc']
    training_module.wiki_page = wiki_page
    training_module.slide_slugs = content['slides'].pluck('slug')
    valid = training_module.valid?
    if training_module.errors[:id].any?
      raise TrainingBase::DuplicateIdError,
            "Duplicate TrainingModule id detected: #{content['id']}.\
             Slugs: #{training_module.slide_slugs}"
    end
    if training_module.errors[:slug].any?
      raise TrainingBase::DuplicateSlugError,
            "Duplicate TrainingModule slug detected: #{slug}"
    end
    training_module.save if valid
    training_module
  rescue StandardError => e
    puts "There's a problem with file '#{slug}'"
    raise e
  end

  ####################
  # Instance methods #
  ####################

  def slides
    return @sorted_slides if @sorted_slides.present?
    selected_slides = TrainingSlide.where(slug: slide_slugs)
    @sorted_slides = selected_slides.sort do |a, b|
      slide_slugs.index(a.slug) <=> slide_slugs.index(b.slug)
    end
  end

  class ModuleNotFound < StandardError; end
end
