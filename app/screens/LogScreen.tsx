import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View, findNodeHandle } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Workout, WorkoutExercise } from '../models/WorkoutDay';
import { initializeDefaultWorkoutDays, loadMyWorkouts } from '../storage/workoutDayStorage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = [
  { label: 'All' },
  { label: 'Muscle building' },
  { label: 'Cardio days' },
];

export default function LogScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [calendarVisible, setCalendarVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [workoutRefs, setWorkoutRefs] = useState<React.RefObject<View>[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [selectedFilter, setSelectedFilter] = useState(0);

  useEffect(() => {
      initializeDefaultWorkoutDays();
    }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      async function fetchWorkouts() {
        const data = await loadMyWorkouts();
        if (!isActive) return;
        data.sort((a, b) => b.date.localeCompare(a.date));
        setWorkouts(data);

        // Mark dates with workouts (highlight with a colored circle)
        const marks: { [date: string]: any } = {};
        data.forEach(w => {
          let hasRed = false;
          let hasYellow = false;
          w.exercises.forEach(ex => {
            if (ex.exerciseType === 'Rep' || ex.exerciseType === 'Calisthenics') {
              hasRed = true;
            }
            if (ex.exerciseType === 'Distance' || ex.exerciseType === 'Time') {
              hasYellow = true;
            }
          });

          if (hasRed && hasYellow) {
            // Both: simulate half-red/half-yellow (use orange as a compromise)
            marks[w.date] = {
              customStyles: {
                container: {
                  backgroundColor: 'orange', // visually represents both
                  borderRadius: 16,
                },
                text: {
                  color: 'white',
                  fontWeight: 'bold',
                },
              },
            };
          } else if (hasRed) {
            // Red
            marks[w.date] = {
              customStyles: {
                container: {
                  backgroundColor: '#9f1907ff',
                  borderRadius: 16,
                },
                text: {
                  color: 'white',
                  fontWeight: 'bold',
                },
              },
            };
          } else if (hasYellow) {
            // Yellow
            marks[w.date] = {
              customStyles: {
                container: {
                  backgroundColor: '#FFD600',
                  borderRadius: 16,
                },
                text: {
                  color: '#333',
                  fontWeight: 'bold',
                },
              },
            };
          }
        });
        setMarkedDates(marks);
      }
      fetchWorkouts();
      return () => { isActive = false; };
    }, [])
  );

  const toggleExpand = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Group exercises by name and render them so each name appears only once
  function renderGroupedExercises(exercises: WorkoutExercise[]) {
    // Group by exerciseName
    const grouped: { [name: string]: WorkoutExercise[] } = {};
    exercises.forEach(ex => {
      if (!grouped[ex.exerciseName]) grouped[ex.exerciseName] = [];
      grouped[ex.exerciseName].push(ex);
    });
    return Object.entries(grouped).map(([name, sets], idx) => (
      <View key={name + idx} style={{ marginBottom: 12 }}>
        <Text style={styles.exerciseName}>- {name}</Text>
        {sets.map((ex, setIdx) => (
          <View key={setIdx} style={styles.exerciseRow}>
            {ex.exerciseType === 'Rep' && (
              <Text style={styles.exerciseInfo}>
                {ex.weight !== undefined ? `    Weight: ${ex.weight}kg  ` : ''}
                {ex.repetitions !== undefined ? `Reps: ${ex.repetitions}` : ''}
              </Text>
            )}
            {ex.exerciseType === 'Time' && (
              <Text style={styles.exerciseInfo}>
                {ex.time ? `    ${ex.time}sec ` : ''}
              </Text>
            )}
            {ex.exerciseType === 'Distance' && (
              <Text style={styles.exerciseInfo}>
                {ex.distance !== undefined ? `    Distance: ${ex.distance}km ` : ''}
                {ex.time ? `${ex.time}min ` : ''}
              </Text>
            )}
            {ex.exerciseType === 'Calisthenics' && (
              <Text style={styles.exerciseInfo}>
                {ex.repetitions !== undefined ? `    Reps: ${ex.repetitions}reps ` : ''}
              </Text>
            )}
          </View>
        ))}
      </View>
    ));
  }

  // Scroll to the first workout with the selected date
  const scrollToWorkout = (date: string) => {
    const idx = workouts.findIndex(w => w.date === date);
    const ref = workoutRefs[idx];
    if (idx !== -1 && ref && ref.current) {
      const nodeHandle = findNodeHandle(ref.current);
      const scrollNodeHandle = findNodeHandle(scrollRef.current);
      if (nodeHandle && scrollRef.current && scrollNodeHandle != null) {
        // @ts-ignore
        ref.current.measureLayout(
          scrollNodeHandle,
          (x: number, y: number) => {
            scrollRef.current?.scrollTo({ y: y - 16, animated: true });
          }
        );
        setExpanded(prev => ({ ...prev, [idx]: true }));
      }
    }
  };

  // Filter workouts based on selected filter
  const filteredWorkouts = workouts.filter(w => {
    if (selectedFilter === 1) {
      // Muscle building: at least one Rep or Calisthenics exercise
      return w.exercises.some(ex => ex.exerciseType === 'Rep' || ex.exerciseType === 'Calisthenics');
    } else if (selectedFilter === 2) {
      // Cardio: at least one Distance or Time exercise
      return w.exercises.some(ex => ex.exerciseType === 'Distance' || ex.exerciseType === 'Time');
    }
    // All: show all workouts
    return true;
  });

  // Group filtered workouts by month
  const workoutsByMonth: { [month: string]: typeof filteredWorkouts } = {};
  filteredWorkouts.forEach(w => {
    const month = new Date(w.date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!workoutsByMonth[month]) workoutsByMonth[month] = [];
    workoutsByMonth[month].push(w);
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#e0e0e0' }}>
      {/* Calendar (if open) */}
      {calendarVisible && (
        <View style={styles.calendarArea}>
          <View style={styles.legendContainer}>
            <View style={styles.legendRow}>
              <View style={[styles.legendCircle, { backgroundColor: '#9f1907ff' }]} />
              <Text style={styles.legendText}>Muscle building day</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendCircle, { backgroundColor: '#FFD600' }]} />
              <Text style={styles.legendText}>Cardio day</Text>
            </View>
          </View>
          <Calendar
            style={styles.calendar}
            markedDates={markedDates}
            markingType={'custom'}
            theme={{
              todayTextColor: '#9f1907ff',
              arrowColor: '#9f1907ff',
              textDayFontWeight: 'bold',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: 'bold',
            }}
          />
        </View>
      )}
      {/* Calendar Button BELOW calendar (always visible) */}
      <View style={styles.calendarButtonContainer}>
        <TouchableOpacity onPress={() => setCalendarVisible(v => !v)} style={styles.calendarButton}>
          <Text style={styles.calendarButtonText}>Calendar</Text>
        </TouchableOpacity>
      </View>
      {/* Filter Buttons BELOW calendar button */}
      <View style={styles.segmentedControl}>
        {FILTERS.map((btn, idx) => (
          <TouchableOpacity
            key={btn.label}
            style={[
              styles.segmentButton,
              idx === 0 && styles.segmentLeft,
              idx === FILTERS.length - 1 && styles.segmentRight,
              selectedFilter === idx && styles.segmentSelected,
            ]}
            onPress={() => setSelectedFilter(idx)}
            activeOpacity={0.85}
          >
            <Text style={[
              styles.segmentText,
              selectedFilter === idx && styles.segmentTextSelected
            ]}>
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.container} ref={scrollRef}>
        {filteredWorkouts.length === 0 && (
          <Text style={styles.empty}>No workouts logged yet.</Text>
        )}
        {Object.entries(workoutsByMonth).map(([month, monthWorkouts]) => (
          <View key={month} style={{ marginBottom: 12 }}>
            <Text style={styles.monthTitle}>
              {month} - {monthWorkouts.length} workout{monthWorkouts.length !== 1 ? 's' : ''}
            </Text>
            {monthWorkouts.map((workout, idx) => {
              const globalIdx = workouts.findIndex(w => w === workout);
              return (
                <View
                  key={workout.date + workout.name + idx}
                  style={{ marginBottom: 16 }}
                  ref={workoutRefs[globalIdx]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(globalIdx)}
                    style={styles.card}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.title}>
                        {workout.name}
                      </Text>
                      <Text style={styles.dateRight}>{workout.date}</Text>
                    </View>
                    {expanded[globalIdx] && (
                      <View style={styles.exerciseList}>
                        {renderGroupedExercises(workout.exercises)}
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#e0e0e0' },
  calendarButtonContainer: { alignItems: 'center', marginTop: 0, marginBottom: 0 },
  calendarButton: {
    backgroundColor: '#9f1907ff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  calendar: { marginBottom: 0, borderRadius: 8, elevation: 0 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 16, elevation: 2 },
  title: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  date: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, marginLeft: 4 },
  dateSmall: { fontSize: 13, fontWeight: 'normal', marginBottom: 2, marginLeft: 4, color: '#555' },
  monthTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6, marginLeft: 2, color: '#9f1907ff' },
  dateRight: { fontSize: 13, fontWeight: 'normal', color: '#555', marginLeft: 8, marginBottom: 2, textAlign: 'right', minWidth: 80 },
  exerciseList: { marginTop: 8 },
  exerciseRow: { marginBottom: 8 },
  exerciseName: { fontSize: 15, fontWeight: 'normal' },
  exerciseInfo: { fontSize: 14, color: '#333', marginLeft: 8 },
  legendContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginLeft: 24,
    marginBottom: 8,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  legendText: {
    fontSize: 13,
    color: '#333',
  },
  calendarArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 12,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 18,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#9f1907ff',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    width: 260,
    height: 40,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: '#9f1907ff',
  },
  segmentLeft: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  segmentRight: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  segmentSelected: {
    backgroundColor: '#f7bdb7',
  },
  segmentText: {
    color: '#9f1907ff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  segmentTextSelected: {
    color: '#9f1907ff',
  },
});

