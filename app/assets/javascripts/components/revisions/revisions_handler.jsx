import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import RevisionList from './revision_list.jsx';
import { fetchRevisions, sortRevisions } from '../../actions/revisions_actions.js';

const RevisionHandler = createReactClass({
  displayName: 'RevisionHandler',

  propTypes: {
    course_id: PropTypes.string,
    course: PropTypes.object,
    fetchRevisions: PropTypes.func,
    limitReached: PropTypes.bool,
    limit: PropTypes.number,
    revisions: PropTypes.array,
    course_specific_revision_ids: PropTypes.array,
    wikidataLabels: PropTypes.object,
    loadingRevisions: PropTypes.bool
  },

  getInitialState() {
    return {
      courseSpecificBool: false,
    };
  },

  UNSAFE_componentWillMount() {
    if (this.props.loadingRevisions) {
      this.props.fetchRevisions(this.props.course_id, this.props.limit);
    }
  },

  sortSelect(e) {
    return this.props.sortRevisions(e.target.value);
  },

  showMore() {
    return this.props.fetchRevisions(this.props.course_id, this.props.limit + 100);
  },

  toggleCourseSpecificBool() {
    this.setState({
      courseSpecificBool: !this.state.courseSpecificBool,
    });
  },

  revisionFilterButtonText() {
    if (this.state.courseSpecificBool) {
      return I18n.t('revisions.show_all');
    }
    return I18n.t('revisions.show_course_specific');
  },

  render() {
    let showMoreButton;
    if (!this.props.limitReached) {
      showMoreButton = <div><button className="button ghost stacked right" onClick={this.showMore}>{I18n.t('revisions.see_more')}</button></div>;
    }
    const revisionFilterButton = <div><button className="button ghost stacked right" onClick={this.toggleCourseSpecificBool}>{this.revisionFilterButtonText()}</button></div>;
    return (
      <div id="revisions">
        <div className="section-header">
          <h3>{I18n.t('application.recent_activity')}</h3>
          {revisionFilterButton}
          <div className="sort-select">
            <select className="sorts" name="sorts" onChange={this.sortSelect}>
              <option value="rating_num">{I18n.t('revisions.class')}</option>
              <option value="title">{I18n.t('revisions.title')}</option>
              <option value="revisor">{I18n.t('revisions.edited_by')}</option>
              <option value="characters">{I18n.t('revisions.chars_added')}</option>
              <option value="references">{I18n.t('revisions.references')}</option>
              <option value="date">{I18n.t('revisions.date_time')}</option>
            </select>
          </div>
        </div>
        <RevisionList
          revisions={(this.state.courseSpecificBool) ? this.props.revisions.filter((revision) => { return this.props.course_specific_revision_ids.includes(revision.id); }) : this.props.revisions}
          course={this.props.course}
          sortBy={this.props.sortRevisions}
          wikidataLabels={this.props.wikidataLabels}
          sort={this.props.sort}
        />
        {showMoreButton}
      </div>
    );
  }
});

const mapStateToProps = state => ({
  limit: state.revisions.limit,
  revisions: state.revisions.revisions,
  course_specific_revision_ids: state.revisions.course_specific_revision_ids,
  limitReached: state.revisions.limitReached,
  wikidataLabels: state.wikidataLabels.labels,
  loadingRevisions: state.revisions.loading,
  sort: state.revisions.sort,
});

const mapDispatchToProps = {
  fetchRevisions,
  sortRevisions
};

export default connect(mapStateToProps, mapDispatchToProps)(RevisionHandler);
