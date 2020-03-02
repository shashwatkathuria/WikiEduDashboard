import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import {
  TRAINING_MODULE_KIND
} from '~/app/assets/javascripts/constants';

export const TrainingModuleRows = ({ trainingModules }) => {
  const trainings = trainingModules.filter(({ kind }) => kind === TRAINING_MODULE_KIND);
  return trainings.map((trainingModule) => {
    let moduleStatus;
    if (trainingModule.completion_date) {
      moduleStatus = (
        <span className="completed">
          {I18n.t('training_status.completed_at')}: {moment(trainingModule.completion_date).format('YYYY-MM-DD   h:mm A')}
          <br/>
          {I18n.t('training_status.completion_time')}: {moment.utc(trainingModule.completion_time * 1000).format('HH:mm:ss')}
        </span>
      );
    } else {
      moduleStatus = (
        <span className="overdue">
          {trainingModule.status}
        </span>
      );
    }
    return (
      <tr className="student-training-module" key={trainingModule.id}>
        <td>{trainingModule.module_name}</td>
        <td>{moduleStatus}</td>
      </tr>
    );
  });
};

TrainingModuleRows.propTypes = {
  trainingModules: PropTypes.arrayOf(
    PropTypes.shape({
      completion_date: PropTypes.string,
      id: PropTypes.number.isRequired,
      module_name: PropTypes.string.isRequired,
      status: PropTypes.string
    }).isRequired
  ).isRequired
};

export default TrainingModuleRows;
