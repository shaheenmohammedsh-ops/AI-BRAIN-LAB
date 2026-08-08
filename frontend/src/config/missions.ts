import type { MissionInfo, MissionStage } from '../types';

export const CHALLENGES: MissionInfo[] = [
  {
    id: 1,
    title: 'Easy Challenge',
    description: 'Build a simple spam detection system',
    customer_objective: 'Filter 90% of spam emails',
    target_accuracy: 0.90,
    difficulty: 'Easy',
    estimated_duration: '2-3 minutes',
    current_challenge: 'Dataset has some missing values'
  },
  {
    id: 2,
    title: 'Hard Challenge',
    description: 'Build an advanced fraud detection system',
    customer_objective: 'Detect 95% of fraudulent transactions',
    target_accuracy: 0.95,
    difficulty: 'Hard',
    estimated_duration: '3-4 minutes',
    current_challenge: 'Dataset has severe class imbalance and noise'
  }
];

export const MISSION_STAGES: Record<number, MissionStage[]> = {
  1: ['briefing', 'dataset_preparation', 'missing_values', 'noise', 'feature_engineering', 'training', 'bias_detection', 'validation', 'concept_drift', 'deployment', 'mission_complete'],
  2: ['briefing', 'dataset_preparation', 'missing_values', 'noise', 'feature_engineering', 'training', 'bias_detection', 'validation', 'concept_drift', 'deployment', 'mission_complete']
};

export const STAGE_DESCRIPTIONS: Record<MissionStage, string> = {
  briefing: 'Review challenge objectives',
  dataset_preparation: 'Clean and prepare training data',
  missing_values: 'Handle missing data in the dataset',
  noise: 'Remove noise from the data',
  feature_engineering: 'Select and optimize relevant features',
  training: 'Train the neural network model',
  bias_detection: 'Detect and fix bias in the model',
  validation: 'Validate model performance on test data',
  concept_drift: 'Address concept drift in the model',
  deployment: 'Deploy model to production environment',
  mission_complete: 'Challenge completed - review results'
};

export const EDUCATIONAL_INSIGHTS: Record<string, Record<string, { insight: string; real_world_application: string }>> = {
  'Dirty Data': {
    'clean_dataset': {
      insight: 'Removing dirty data improves model generalization and reduces overfitting.',
      real_world_application: 'Data scientists spend 60-80% of time cleaning data in real projects.'
    },
    'normalize_data': {
      insight: 'Normalization ensures features contribute equally to model learning.',
      real_world_application: 'Essential for distance-based algorithms like neural networks.'
    }
  },
  'Missing Values': {
    'normalize_data': {
      insight: 'Handling missing values prevents bias and maintains data integrity.',
      real_world_application: 'Medical datasets often have incomplete patient records.'
    }
  },
  'Noise': {
    'remove_noise': {
      insight: 'Removing noise improves signal-to-noise ratio for better learning.',
      real_world_application: 'Sensor data in IoT devices frequently contains noise.'
    }
  },
  'Class Imbalance': {
    'balance_dataset': {
      insight: 'Balanced classes prevent model bias toward majority classes.',
      real_world_application: 'Fraud detection has 99% legitimate vs 1% fraudulent transactions.'
    },
    'collect_more_data': {
      insight: 'More data helps minority class representation and model robustness.',
      real_world_application: 'Rare diseases need specialized data collection efforts.'
    }
  },
  'Data Drift': {
    'collect_more_data': {
      insight: 'Fresh data helps models adapt to changing distributions.',
      real_world_application: 'Consumer behavior changes during holidays and crises.'
    },
    'feature_selection': {
      insight: 'Selecting stable features reduces sensitivity to drift.',
      real_world_application: 'Financial models need robust features across market conditions.'
    }
  },
  'Bias': {
    'tune_hyperparameters': {
      insight: 'Proper regularization reduces model overfitting to biased patterns.',
      real_world_application: 'HR hiring models require careful bias mitigation.'
    }
  },
  'Concept Drift': {
    'feature_selection': {
      insight: 'Adaptive feature selection captures evolving relationships.',
      real_world_application: 'Spam filters adapt to new spam techniques.'
    },
    'validate_model': {
      insight: 'Continuous validation detects performance degradation early.',
      real_world_application: 'Autonomous systems require ongoing safety validation.'
    }
  }
};