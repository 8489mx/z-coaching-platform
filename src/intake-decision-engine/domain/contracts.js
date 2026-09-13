/**
 * @typedef {Object} ClientIntake
 * @property {PersonalData} personal
 * @property {GoalData} goals
 * @property {BodyData} body
 * @property {LifestyleData} lifestyle
 * @property {MedicalData} medical
 * @property {NutritionData} nutrition
 * @property {TrainingData} training
 * @property {CardioData} cardio
 * @property {string[]=} unclassifiedNotes Free text is flagged but never interpreted.
 */

/** @typedef {{assessmentDate:string}} EvaluationContext Trusted server-side evaluation context, not client form data. */

/** @typedef {{dateOfBirth:string, sex:string, residenceCountry:string, guardianConsent?:boolean|null}} PersonalData */
/** @typedef {{primary:string, secondaryTraining?:string|null}} GoalData */
/** @typedef {{heightCm:number, weightKg:number, waistCm?:number|null, weightTrend:string, measurementQuality:string, progressPhotosAvailable:boolean}} BodyData */
/**
 * @typedef {Object} LifestyleData
 * @property {string} dailyActivity
 * @property {string} [occupationType] - Client's primary occupation type for NEAT baseline classification.
 * @property {{type:string, physicallyDemandingDays:string[]}} workSchedule
 * @property {{averageHours:number, quality:string}} sleep
 * @property {string} stressLevel
 */
/** @typedef {{conditionCode:string, otherConditionText:null|string, stability:string, physicianInstructions:string[], unclassifiedInstructionsText?:string|null}} ClassifiedMedicalCondition `otherConditionText` must be null or the empty string. */
/** @typedef {{conditionCode:null, otherConditionText:string, stability:string, physicianInstructions:string[], unclassifiedInstructionsText?:string|null}} OtherMedicalCondition `otherConditionText` is preserved verbatim and must contain non-whitespace text. */
/** @typedef {ClassifiedMedicalCondition|OtherMedicalCondition} MedicalCondition */
/** @typedef {{chestPainOrPressure:string, fainting:string, unusualShortnessOfBreath:string, abnormalPalpitations:string, otherDangerousSymptomsPresent:string, otherDangerousSymptoms:string[]}} DangerousSymptoms */
/** @typedef {{conditions:MedicalCondition[], dangerousSymptoms:DangerousSymptoms, medications:string[], eatingDisorderHistory:string, pregnancyStatus:string, menstrualStatus:string, unclassifiedText:string[]}} MedicalData */
/** @typedef {{substance:string, medicallyConfirmed:boolean}} FoodAllergy */
/** @typedef {{substance:string, severity:string, medicallyDiagnosed:boolean, notes?:string|null}} FoodIntolerance */
/** @typedef {{preferredMealCount:number, unavailableEatingWindows:Array<{start:string,end:string}>, budget:string, foodStorageAvailable:boolean, foodReheatingAvailable:boolean, allergies:FoodAllergy[], medicalExclusions:Array<{food:string,instruction:string,source:string}>, dislikedFoods:string[], intolerances:FoodIntolerance[], digestiveIssues:Array<{name:string,severity:string}>}} NutritionData */
/** @typedef {{area:string, painLevel:number, movementImpact:string, worsening:boolean, numbnessOrWeakness:boolean, affectedMovements:string[], medicalRestrictions:MovementRestriction[]}} Injury */
/** @typedef {{movement:string, instruction:string, source:string}} MovementRestriction */
/** @typedef {"MONDAY"|"TUESDAY"|"WEDNESDAY"|"THURSDAY"|"FRIDAY"|"SATURDAY"|"SUNDAY"} DayOfWeekValue */
/** @typedef {"FIXED_AVAILABLE_DAYS"|"FIXED_UNAVAILABLE_DAYS"|"VARIABLE"|"FLEXIBLE"} TrainingScheduleAvailabilityTypeValue */
/** @typedef {"DUMBBELLS"|"BARBELL_AND_PLATES"|"ADJUSTABLE_BENCH"|"FLAT_BENCH"|"RESISTANCE_BANDS"|"PULL_UP_BAR"|"SQUAT_RACK"|"SMITH_MACHINE"|"CABLE_STATION"|"SELECTORIZED_MACHINES"|"KETTLEBELLS"} NonBodyweightEquipmentCodeValue */
/** @typedef {{equipmentCode:"BODYWEIGHT",otherEquipmentText:null|"",loadCapacity:"BODYWEIGHT_ONLY"}} BodyweightTrainingEquipment */
/** @typedef {{equipmentCode:NonBodyweightEquipmentCodeValue,otherEquipmentText:null|"",loadCapacity:"LIGHT"|"MODERATE"|"HEAVY"}} ClassifiedTrainingEquipment */
/** @typedef {{equipmentCode:null,otherEquipmentText:string,loadCapacity:"LIGHT"|"MODERATE"|"HEAVY"|"NOT_APPLICABLE"}} OtherTrainingEquipment The original non-whitespace text is preserved verbatim and never mapped automatically. */
/** @typedef {BodyweightTrainingEquipment|ClassifiedTrainingEquipment|OtherTrainingEquipment} TrainingEquipment */
/** @typedef {{location:string, equipment:TrainingEquipment[], maxDaysPerWeek:number, preferredDaysPerWeek:number, trainingScheduleAvailabilityType:TrainingScheduleAvailabilityTypeValue, availableTrainingDays:DayOfWeekValue[], unavailableTrainingDays:DayOfWeekValue[], maxSessionMinutes:number, experience:string, recentTraining:string, injuries:Injury[], medicalMovementRestrictions:MovementRestriction[]}} TrainingData */
/** @typedef {"FOOTBALL"|"RUNNING"|"CYCLING"|"SWIMMING"|"BOXING"|"MARTIAL_ARTS"|"BASKETBALL"|"HANDBALL"|"VOLLEYBALL"|"RACKET_SPORTS"|"CROSSFIT_OR_FUNCTIONAL"} SportCodeValue */
/** @typedef {"LOW"|"MODERATE"|"HIGH"} SportIntensityValue */
/** @typedef {"RECREATIONAL"|"COMPETITIVE"} SportParticipationLevelValue */
/** @typedef {{sportCode:SportCodeValue,otherSportText:null|"",days:DayOfWeekValue[],minutesPerSession:number,intensity:SportIntensityValue,participationLevel:SportParticipationLevelValue}} ClassifiedAdditionalSport */
/** @typedef {{sportCode:null,otherSportText:string,days:DayOfWeekValue[],minutesPerSession:number,intensity:SportIntensityValue,participationLevel:SportParticipationLevelValue}} OtherAdditionalSport The original non-whitespace text is preserved verbatim and never mapped automatically. */
/** @typedef {ClassifiedAdditionalSport|OtherAdditionalSport} AdditionalSport */
/** @typedef {{additionalSports:AdditionalSport[], averageDailySteps:number|null, walkingAbility:string, maxSessionsPerWeek:number, maxDurationMinutes:number}} CardioData */

/** @typedef {{code:string, scope:string, value:unknown, reason:string}} DecisionConstraint */
/** @typedef {{code:string, scope:string, level:string, message:string, sourcePath:string}} ReviewFlag */
/** @typedef {{code:string, scope:string, message:string}} DecisionReason */
/** @typedef {{code:string, path:string, message:string}} DataIssue */

/**
 * @typedef {Object} IntakeDecision
 * @property {string} plan_status
 * @property {DecisionConstraint[]} hard_constraints
 * @property {DecisionConstraint[]} soft_preferences
 * @property {ReviewFlag[]} review_flags
 * @property {{calorie_direction:string, confidence:string, meal_count_strategy:string, constraints:DecisionConstraint[], reasons:DecisionReason[]}} nutrition_decision
 * @property {{recommended_days:number, schedule_mode:string, intro_week_required:boolean, volume_start:string, constraints:DecisionConstraint[], reasons:DecisionReason[]}} training_decision
 * @property {{strategy:string, max_sessions:number, max_duration_minutes:number, intensity_start:string, constraints:DecisionConstraint[], reasons:DecisionReason[]}} cardio_decision
 * @property {{strategy:string, max_duration_minutes:number, constraints:DecisionConstraint[], reasons:DecisionReason[]}} mobility_decision
 * @property {DecisionReason[]} decision_reasons
 * @property {DataIssue[]} missing_or_uncertain_data
 */

export {};
