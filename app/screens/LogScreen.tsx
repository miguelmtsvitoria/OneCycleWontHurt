import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View, findNodeHandle } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Workout, WorkoutExercise } from '../models/WorkoutDay';
import { initializeDefaultWorkoutDays, loadMyWorkouts } from '../storage/workoutDayStorage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LogScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [calendarVisible, setCalendarVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [workoutRefs, setWorkoutRefs] = useState<React.RefObject<View>[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});

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

  // Group workouts by month
  const workoutsByMonth: { [month: string]: typeof workouts } = {};
  workouts.forEach(w => {
    const month = new Date(w.date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!workoutsByMonth[month]) workoutsByMonth[month] = [];
    workoutsByMonth[month].push(w);
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#e0e0e0' }}>
      {calendarVisible && (
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
      )}
      <View style={styles.calendarButtonContainer}>
        <TouchableOpacity onPress={() => setCalendarVisible(v => !v)} style={styles.calendarButton}>
          <Text style={styles.calendarButtonText}>Calendar</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container} ref={scrollRef}>
        {workouts.length === 0 && (
          <Text style={styles.empty}>No workouts logged yet.</Text>
        )}
        {Object.entries(workoutsByMonth).map(([month, monthWorkouts]) => (
          <View key={month} style={{ marginBottom: 12 }}>
            <Text style={styles.monthTitle}>
              {month} - {monthWorkouts.length} workout{monthWorkouts.length !== 1 ? 's' : ''}
            </Text>
            {monthWorkouts.map((workout, idx) => {
              // Find the global index for expanded/collapse and ref
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
  calendarButtonContainer: { alignItems: 'center', marginTop: 0, marginBottom: 8 },
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
});

