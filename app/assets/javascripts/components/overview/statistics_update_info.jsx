import React from 'react';
import createReactClass from 'create-react-class';
import moment from 'moment';
import Modal from '../common/modal';
import PropTypes from 'prop-types';

const StatisticsUpdateInfo = createReactClass({
  displayName: 'StatisticsUpdateInfo',

  propTypes: {
    course: PropTypes.object.isRequired,
  },

  getInitialState() {
    return {
      renderModal: false
    };
  },

  getUpdateTimesMessage() {
    const course = this.props.course;

    const lastUpdate = course.updates.last_update.end_time;
    const lastUpdateMoment = moment.utc(lastUpdate);
    const averageDelay = course.updates.average_delay;
    let lastUpdateMessage = '';
    if (lastUpdate) {
      lastUpdateMessage = `${I18n.t('metrics.last_update')}: ${lastUpdateMoment.fromNow()}`;
    }

    const nextUpdateExpectedTime = lastUpdateMoment.add(averageDelay, 'seconds');
    let nextUpdateMessage = '';
    if (nextUpdateExpectedTime.isAfter()) {
      nextUpdateMessage = `${I18n.t('metrics.next_update')}: ${nextUpdateExpectedTime.fromNow()}`;
    }

    return [lastUpdateMessage, nextUpdateMessage];
  },

  getCourseUpdateErrorMessage() {
    let courseUpdateErrorMessage = '';
    const errorCount = this.props.course.updates.last_update.error_count;
    if (errorCount > 0) {
      courseUpdateErrorMessage = `${I18n.t('metrics.error_count_message', { error_count: errorCount })} `;
    }
    return courseUpdateErrorMessage;
  },

  toggleModal() {
    this.setState({
      renderModal: !this.state.renderModal
    });
  },

  render() {
    const course = this.props.course;

    if ((Features.wikiEd && !course.ended) || !course.updates.last_update) {
      return <div />;
    }

    const [lastUpdateMessage, nextUpdateMessage] = this.getUpdateTimesMessage();

    // If no errors, display only update time information
    if (course.updates.last_update.error_count === 0) {
      return (
        <div className="pull-right">
          <small className="mb2">{lastUpdateMessage}<br/>{nextUpdateMessage}</small>
        </div>
      );
    }

    // If there are errors

    // Render Modal
    if (this.state.renderModal) {
      const helpMessage = Features.wikiEd ? I18n.t('metrics.wiki_ed_help') : I18n.t('metrics.outreach_help');

      return (
        <Modal>
          <div className="course-update-stats" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
            { this.getCourseUpdateErrorMessage() }
            <br/>
            {I18n.t('metrics.replag_info')}
            <br/>
            <a href="https://replag.toolforge.org/">{I18n.t('metrics.replag_link')}</a>
            <br/>
            <button className="button dark mt2" onClick={this.toggleModal}>{I18n.t('metrics.close_modal')}</button>
            <br/>
            <small className="mb2">{helpMessage}</small>
          </div>
        </Modal>
      );
    }

    // Render update time information along with 'See More' button to open modal
    return (
      <div className="pull-right">
        <small className="mb2">
          {lastUpdateMessage}
          <br/>
          {nextUpdateMessage}
          <br/>
          <a onClick={this.toggleModal} className="button pull-right small">{I18n.t('metrics.update_statistics_button')}</a>
        </small>
      </div>
    );
  }
});

export default StatisticsUpdateInfo;
