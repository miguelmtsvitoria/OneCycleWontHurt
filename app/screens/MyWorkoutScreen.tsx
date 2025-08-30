import { MaterialCommunityIcons } from '@expo/vector-icons'; // Add this import for the trash icon
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av'; // Add this import for beep sound
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useWorkoutContext } from '../context/WorkoutContext'; // Add this import
import { Exercise } from '../models/Exercise';
import { Workout } from '../models/Workout';
import { initializeDefaultExercises, loadExercises, saveExercises } from '../storage/exerciseStorage';
import { addMyWorkout, loadMyWorkouts } from '../storage/workoutDayStorage';
import { initializeDefaultWorkouts, loadWorkouts } from '../storage/workoutStorage';

export default function MyWorkoutScreen() {
  const route = useRoute();
  const workoutName = route.params?.workoutName;
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exerciseInputs, setExerciseInputs] = useState<any[]>([]);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [timers, setTimers] = useState<{ [idx: number]: { running: boolean, seconds: number } }>(
    {}
  );
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [previousExerciseValues, setPreviousExerciseValues] = useState<any[]>([]);
  const [defaultTimerSeconds, setDefaultTimerSeconds] = useState(120); // Add this line
  const { setWorkoutActive } = useWorkoutContext(); // Add this line
  const navigation = useNavigation(); // Add this line
  const [quitVisible, setQuitVisible] = useState(false); // Add this line

  useEffect(() => {
    initializeDefaultWorkouts();
    initializeDefaultExercises();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      async function fetchWorkoutAndExercises() {
        if (workoutName && workoutName !== '') {
          const workouts = await loadWorkouts();
          const found = workouts.find((w: Workout) => w.name === workoutName);
          setSelectedWorkout(found || null);

          const exercises = await loadExercises();
          setAllExercises(exercises);
        } else {
          setSelectedWorkout(null);
          setAllExercises([]);
        }
      }
      fetchWorkoutAndExercises();
    }, [workoutName])
  );

  // Reset inputs when workout name changes (not when exercises change)
  useEffect(() => {
    if (selectedWorkout) {
      setExerciseInputs(
        selectedWorkout.exercises.map((exerciseName: string) => ({}))
      );
      setCurrentExerciseIdx(0);
    }
  }, [selectedWorkout?.name]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  // Fetch previous workout values for comparison
  useEffect(() => {
    async function fetchPreviousValues() {
      if (!selectedWorkout) {
        setPreviousExerciseValues([]);
        return;
      }
      const allPrevWorkouts = await loadMyWorkouts();
      // Sort by date descending
      allPrevWorkouts.sort((a, b) => (b.date > a.date ? 1 : -1));
      const prevValues: any[] = [];

      // Find the most recent previous workout with the same name
      const prevWorkout = allPrevWorkouts.find(w => w.name === selectedWorkout.name);
      if (!prevWorkout) {
        setPreviousExerciseValues(Array(selectedWorkout.exercises.length).fill(null));
        return;
      }

      // Map: exercise name -> list of previous sets (in order)
      const prevSetsByName: { [name: string]: any[] } = {};
      prevWorkout.exercises.forEach(e => {
        if (!prevSetsByName[e.exerciseName]) prevSetsByName[e.exerciseName] = [];
        prevSetsByName[e.exerciseName].push(e);
      });

      // For each exercise in the current workout, find the nth occurrence in previous workout
      const occurrenceCount: { [name: string]: number } = {};
      selectedWorkout.exercises.forEach((exName, idx) => {
        occurrenceCount[exName] = (occurrenceCount[exName] || 0) + 1;
        const prevList = prevSetsByName[exName] || [];
        prevValues.push(prevList[occurrenceCount[exName] - 1] || null);
      });

      setPreviousExerciseValues(prevValues);
    }
    fetchPreviousValues();
  }, [selectedWorkout]);

  // Helper: play 10s countdown sound
  async function playCountdownSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/10sec.mp3'), // Your 10s countdown sound
        { shouldPlay: true }
      );
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 12000); // Unload after 12s for safety
    } catch { }
  }

  // Timer tick effect
  useEffect(() => {
    if (!timers[currentExerciseIdx]?.running) return;
    if (timerInterval) clearInterval(timerInterval);

    let countdownPlayed = false;

    const interval = setInterval(() => {
      setTimers(prev => {
        const t = prev[currentExerciseIdx];
        if (!t || !t.running) return prev;
        // Play countdown sound ONCE at 11 seconds left
        if (t.seconds === 11 && !countdownPlayed) {
          playCountdownSound();
          countdownPlayed = true;
        }
        if (t.seconds > 0) {
          return {
            ...prev,
            [currentExerciseIdx]: { ...t, seconds: t.seconds - 1 }
          };
        } else {
          clearInterval(interval);
          setCurrentExerciseIdx(idx => Math.min(idx + 1, selectedWorkout?.exercises.length - 1 ?? 0));
          return {
            ...prev,
            [currentExerciseIdx]: { ...t, running: false }
          };
        }
      });
    }, 1000);
    setTimerInterval(interval as unknown as NodeJS.Timeout);
    return () => clearInterval(interval);
  }, [timers[currentExerciseIdx]?.running]);

  // Helper to check if all required fields are filled for the current exercise
  function isCurrentExerciseFilled(idx: number) {
    const exerciseObj = allExercises.find(e => e.name === selectedWorkout?.exercises[idx]);
    const input = exerciseInputs[idx] || {};
    if (!exerciseObj) return false;
    switch (exerciseObj.type) {
      case 'Rep':
        return input.weight && input.repetitions;
      case 'Time':
        return input.timeSeconds;
      case 'Distance':
        // Fix: check for distanceKm and timeMin, not input.distance
        return input.distanceKm && input.timeMin;
      case 'Calisthenics':
        return input.repetitions;
      default:
        return false;
    }
  }

  function renderInputsForType(type: string, idx: number, disabled: boolean) {
    const updateInput = (field: string, value: string) => {
      setExerciseInputs(inputs => {
        const updated = [...inputs];
        updated[idx] = { ...updated[idx], [field]: value };
        return updated;
      });
    };

    // Get previous value for this exercise
    const prev = previousExerciseValues[idx];

    let prevText = '';
    if (prev) {
      if (type === 'Rep') {
        prevText = `${prev.weight ?? ''}kg x ${prev.repetitions ?? ''}reps`;
      } else if (type === 'Time') {
        prevText = `${prev.time ?? ''}s`;
      } else if (type === 'Distance') {
        const km = prev.distance ? (prev.distance).toFixed(2) : '';
        const min = prev.time ? Math.round(prev.time) : '';
        prevText = `${km}km in ${min}min`;
      } else if (type === 'Calisthenics') {
        prevText = `${prev.repetitions ?? ''}reps`;
      }
    }

    switch (type) {
      case 'Rep':
        return (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Weight:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="kg"
              value={exerciseInputs[idx]?.weight || ''}
              onChangeText={v => updateInput('weight', v)}
              editable={!disabled}
            />
            <Text style={styles.inputLabel}>Reps:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="reps"
              value={exerciseInputs[idx]?.repetitions || ''}
              onChangeText={v => updateInput('repetitions', v)}
              editable={!disabled}
            />
            <Text style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>
              {prevText ? `Last: ${prevText}` : ''}
            </Text>
          </View>
        );
      case 'Time':
        return (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>sec: </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="seconds"
              value={exerciseInputs[idx]?.timeSeconds || ''}
              onChangeText={v => updateInput('timeSeconds', v)}
              editable={!disabled}
            />
            <Text style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>
              {prevText ? `Last: ${prevText}` : ''}
            </Text>
          </View>
        );
      case 'Distance':
        return (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>km: </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="km"
              value={exerciseInputs[idx]?.distanceKm || ''}
              onChangeText={v => updateInput('distanceKm', v)}
              editable={!disabled}
            />
            <Text style={styles.inputLabel}>min: </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="min"
              value={exerciseInputs[idx]?.timeMin || ''}
              onChangeText={v => updateInput('timeMin', v)}
              editable={!disabled}
            />
            <Text style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>
              {prevText ? `Last: ${prevText}` : ''}
            </Text>
          </View>
        );
      case 'Calisthenics':
        return (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>reps: </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="reps"
              value={exerciseInputs[idx]?.repetitions || ''}
              onChangeText={v => updateInput('repetitions', v)}
              editable={!disabled}
            />
            <Text style={{ marginLeft: 8, color: '#888', fontSize: 13 }}>
              {prevText ? `Last: ${prevText}` : ''}
            </Text>
          </View>
        );
      default:
        return null;
    }
  }

  const handleDeleteExercise = (idx: number) => {
    if (!selectedWorkout) return;

    // Remove the exercise and its input
    setSelectedWorkout(prev =>
      prev
        ? {
          ...prev,
          exercises: prev.exercises.filter((_, i) => i !== idx),
        }
        : null
    );
    setExerciseInputs(inputs => inputs.filter((_, i) => i !== idx));

    // Adjust currentExerciseIdx if needed
    setCurrentExerciseIdx(prevIdx => {
      if (prevIdx > idx) {
        // If deleted before current, move back one
        return prevIdx - 1;
      } else if (prevIdx === idx) {
        // If deleted current, stay at same index (which is now the next exercise)
        return prevIdx >= (selectedWorkout?.exercises.length ?? 1) - 1
          ? Math.max(0, prevIdx - 1)
          : prevIdx;
      }
      return prevIdx;
    });

    setConfirmDeleteIdx(null);
  };

  // Helper: Find PRs in the finished workout
  async function getPRsForWorkout(workoutExercises: any[], allPrevWorkouts: any[], allExercises: Exercise[]) {
    const prs: string[] = [];

    for (let i = 0; i < workoutExercises.length; i++) {
      const ex = workoutExercises[i];
      const exMeta = allExercises.find(e => e.name === ex.exerciseName);
      if (!exMeta) continue;

      // Gather all previous attempts for this exercise (by name)
      const prevAttempts = allPrevWorkouts
        .flatMap(w => w.exercises)
        .filter(e => e.exerciseName === ex.exerciseName && e.exerciseType === ex.exerciseType);

      let isPR = false;
      let prText = '';

      if (ex.exerciseType === 'Rep') {
        // PR if weight is highest, or if same weight, reps is highest
        const maxWeight = Math.max(...prevAttempts.map(e => e.weight || 0), 0);
        const maxRepsAtWeight = Math.max(
          ...prevAttempts.filter(e => e.weight === ex.weight).map(e => e.repetitions || 0),
          0
        );
        if ((ex.weight > maxWeight) ||
          (ex.weight === maxWeight && ex.repetitions > maxRepsAtWeight && maxWeight > 0)) {
          isPR = true;
          prText = `${ex.exerciseName} - ${ex.weight}kg ${ex.repetitions} reps`;
        }
      } else if (ex.exerciseType === 'Distance') {
        // PR if distance is highest, or if same distance, time is lowest
        const maxDist = Math.max(...prevAttempts.map(e => e.distance || 0), 0);
        const minTimeAtDist = Math.min(
          ...prevAttempts.filter(e => e.distance === ex.distance).map(e => e.time || Infinity),
          Infinity
        );
        if ((ex.distance > maxDist) ||
          (ex.distance === maxDist && ex.time < minTimeAtDist && maxDist > 0)) {
          isPR = true;
          const km = ex.distance ? (ex.distance).toFixed(2) : '';
          const min = ex.time ? Math.round((ex.time)) : '';
          prText = `${ex.exerciseName} - ${km}km ${min}min`;
        }
      } else if (ex.exerciseType === 'Time') {
        // PR if time is highest
        const maxTime = Math.max(...prevAttempts.map(e => e.time || 0), 0);
        if (ex.time > maxTime) {
          isPR = true;
          prText = `${ex.exerciseName} - ${ex.time}s`;
        }
      } else if (ex.exerciseType === 'Calisthenics') {
        // PR if reps is highest
        const maxReps = Math.max(...prevAttempts.map(e => e.repetitions || 0), 0);
        if (ex.repetitions > maxReps) {
          isPR = true;
          prText = `${ex.exerciseName} - ${ex.repetitions} reps`;
        }
      }

      if (isPR && prText) {
        prs.push(prText);
      }
    }

    return prs;
  }

  const handleFinishWorkout = async () => {
    if (!selectedWorkout) return;

    const workoutExercises = selectedWorkout.exercises.map((exerciseName: string, idx: number) => {
      const exerciseObj = allExercises.find(e => e.name === exerciseName);
      const input = exerciseInputs[idx] || {};
      if (exerciseObj?.type === 'Distance') {
        const distance = input.distanceKm ? Number(input.distanceKm) : undefined;
        const time = input.timeMin ? Number(input.timeMin) : undefined;
        return {
          exerciseName,
          exerciseType: exerciseObj.type,
          distance: distance ? distance : undefined,
          time: time ? time : undefined,
        };
      }
      return {
        exerciseName,
        exerciseType: exerciseObj?.type || '',
        weight: input.weight ? Number(input.weight) : undefined,
        repetitions: input.repetitions ? Number(input.repetitions) : undefined,
        time: input.timeSeconds ? Number(input.timeSeconds) : undefined,
        distance: undefined,
      };
    });

    const updatedExercises = [...allExercises];

    for (let i = 0; i < workoutExercises.length; i++) {
      const w = workoutExercises[i];
      if (w.exerciseType !== 'Rep' || !w.weight || !w.repetitions) continue;

      const idx = updatedExercises.findIndex(e => e.name === w.exerciseName);
      if (idx === -1) continue;
    }
    await saveExercises(updatedExercises);

    const workoutDay = {
      name: selectedWorkout.name,
      exercises: workoutExercises,
      date: new Date().toISOString().slice(0, 10),
    };

    await addMyWorkout(workoutDay);

    // --- PR detection and message ---
    const allPrevWorkouts = await loadMyWorkouts();
    // Remove the just-added workout from previous list for PR check
    const prevWorkouts = allPrevWorkouts.slice(0, -1);

    const prs = await getPRsForWorkout(workoutExercises, prevWorkouts, allExercises);

    let message = 'Workout saved!';
    if (prs.length > 0) {
      message += '\nCongratulations, new PRs:\n' + prs.join('\n');
    }

    Alert.alert(message);
    setSelectedWorkout(null);
    setExerciseInputs([]);
    navigation.navigate('Log');
  };

  // Timer UI
  function renderTimer(idx: number) {
    const timer = timers[idx] || { running: false, seconds: defaultTimerSeconds };
    const min = Math.floor(timer.seconds / 60).toString().padStart(2, '0');
    const sec = (timer.seconds % 60).toString().padStart(2, '0');
    const filled = isCurrentExerciseFilled(idx);

    const handleAdjust = (delta: number) => {
      setTimers(t => {
        const updated = { ...t, [idx]: { ...timer, seconds: Math.max(0, timer.seconds + delta) } };
        // If this is the current exercise, update the default for next ones
        if (idx === currentExerciseIdx) {
          setDefaultTimerSeconds(Math.max(0, timer.seconds + delta));
        }
        return updated;
      });
    };

    return (
      <View style={styles.timerRow}>
        <View style={styles.timerAdjustCol}>
          <TouchableOpacity
            onPress={() => handleAdjust(30)}
            disabled={!filled || timer.running}
            style={{ opacity: (!filled || timer.running) ? 0.5 : 1 }}
          >
            <Text style={styles.timerAdjust}>+</Text>
          </TouchableOpacity>
          <Text style={styles.timerAdjustLabel}>30 sec</Text>
          <TouchableOpacity
            onPress={() => handleAdjust(-30)}
            disabled={!filled || timer.running}
            style={{ opacity: (!filled || timer.running) ? 0.5 : 1 }}
          >
            <Text style={styles.timerAdjust}>-</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.timerDisplay,
            { backgroundColor: '#d32f2f', opacity: (!filled || timer.running) ? 0.7 : 1 }
          ]}
          onPress={() => {
            if (!timer.running && filled) {
              setTimers(t => ({
                ...t,
                [idx]: { ...timer, running: true }
              }));
            }
          }}
          activeOpacity={timer.running || !filled ? 1 : 0.7}
          disabled={!filled || timer.running}
        >
          <Text style={styles.timerText}>{min}:{sec}</Text>
          {!timer.running && (
            <Text style={{ color: 'white', fontSize: 12, marginTop: 2 }}>Start Timer</Text>
          )}
        </TouchableOpacity>
        <Text style={{ marginHorizontal: 6, fontSize: 16, color: '#333', fontWeight: 'bold' }}>or</Text>
        <TouchableOpacity
          style={[
            styles.timerNextButton,
            { backgroundColor: '#388e3c', opacity: (!filled || timer.running) ? 0.5 : 1 }
          ]}
          onPress={() => setCurrentExerciseIdx(idx + 1)}
          disabled={!filled || timer.running}
        >
          <Text style={styles.timerNextText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    setWorkoutActive(!!selectedWorkout); // Sync context with selectedWorkout
  }, [selectedWorkout]);

  // When workout changes, reset timers to default for all exercises
  useEffect(() => {
    if (selectedWorkout) {
      setTimers(
        selectedWorkout.exercises.reduce((acc, _, idx) => {
          acc[idx] = { running: false, seconds: defaultTimerSeconds };
          return acc;
        }, {} as { [idx: number]: { running: boolean; seconds: number } })
      );
    }
  }, [selectedWorkout?.name, defaultTimerSeconds]);

  // When moving to the next exercise, initialize its timer with the default value if not set
  useEffect(() => {
    if (
      selectedWorkout &&
      currentExerciseIdx < selectedWorkout.exercises.length &&
      !timers[currentExerciseIdx]
    ) {
      setTimers(t => ({
        ...t,
        [currentExerciseIdx]: { running: false, seconds: defaultTimerSeconds }
      }));
    }
  }, [currentExerciseIdx, selectedWorkout, timers, defaultTimerSeconds]);

  return (
    <View style={styles.container}>
      {/* Header row: Workout title + Quit button */}
      {workoutName && selectedWorkout && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12, paddingHorizontal: 16 }}>
          <Text style={[styles.title, { flex: 1 }]}>{workoutName}</Text>
          <TouchableOpacity
            style={styles.quitButtonRed}
            onPress={() => setQuitVisible(true)}
            accessibilityLabel="Quit workout"
          >
            <Text style={styles.quitButtonRedText}>Quit workout</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView>
        {selectedWorkout ? (
          <View style={styles.card}>
            {selectedWorkout.exercises.map((exerciseName: string, idx: number) => {
              const exerciseObj = allExercises.find(e => e.name === exerciseName);
              // Inputs are editable if idx <= currentExerciseIdx, locked otherwise
              const isLocked = idx > currentExerciseIdx;
              return (
                <View key={idx} style={styles.exerciseCardRow}>
                  <View style={{ flex: 1, opacity: isLocked ? 0.5 : 1 }}>
                    <Text style={styles.exercise}>{exerciseName}</Text>
                    {exerciseObj && renderInputsForType(exerciseObj.type, idx, isLocked)}
                    {!exerciseObj && (
                      <Text style={{ color: 'red' }}>Exercise not found in storage</Text>
                    )}
                    {/* Show Timer or Next for current exercise */}
                    {idx === currentExerciseIdx && idx < selectedWorkout.exercises.length - 1 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        {renderTimer(idx)}
                      </View>
                    )}
                  </View>
                  {/* Only allow delete for current exercise */}
                  {idx === currentExerciseIdx && (
                    confirmDeleteIdx === idx ? (
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                          onPress={() => handleDeleteExercise(idx)}
                          style={styles.confirmButton}
                          accessibilityLabel={`Confirm delete ${exerciseName}`}
                        >
                          <MaterialCommunityIcons name="check-circle-outline" size={24} color="#388e3c" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setConfirmDeleteIdx(null)}
                          style={styles.cancelButton}
                          accessibilityLabel="Cancel delete"
                        >
                          <MaterialCommunityIcons name="close-circle-outline" size={24} color="#b71c1c" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setConfirmDeleteIdx(idx)}
                        style={styles.deleteButton}
                        accessibilityLabel={`Delete ${exerciseName}`}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#b71c1c" style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }} />
                      </TouchableOpacity>
                    )
                  )}
                </View>
              );
            })}
            <View style={styles.finishButtonContainer}>
              <TouchableOpacity
                onPress={handleFinishWorkout}
                style={[
                  styles.finishButton,
                  { opacity: currentExerciseIdx === selectedWorkout.exercises.length - 1 && isCurrentExerciseFilled(currentExerciseIdx) ? 1 : 0.5 }
                ]}
                disabled={currentExerciseIdx !== selectedWorkout.exercises.length - 1 || !isCurrentExerciseFilled(currentExerciseIdx)}
              >
                <Text style={styles.finishButtonText}>Finish workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          workoutName && (
            <Text style={styles.empty}>Workout not found.</Text>
          )
        )}
      </ScrollView>
      {/* Quit workout confirmation modal */}
      <Modal
        visible={quitVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuitVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContainerLeft}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, alignSelf: 'flex-start' }}>You sure?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: '#ccc', marginRight: 8 }]}
                onPress={() => setQuitVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setQuitVisible(false);
                  setSelectedWorkout(null);
                  setExerciseInputs([]);
                  setWorkoutActive(false);
                  navigation.navigate('Workouts');
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#e0e0e0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exerciseCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 10,
    marginVertical: 4,
  },
  exerciseCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 10,
    marginVertical: 4,
  },
  exercise: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 4,
    marginRight: 8,
    width: 60,
    fontSize: 14,
  },
  finishButtonContainer: { alignItems: 'center', marginTop: 0, marginBottom: 8 },
  finishButton: {
    backgroundColor: '#9f1907ff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  confirmButton: {
    marginLeft: 8,
    padding: 4,
  },
  cancelButton: {
    marginLeft: 4,
    padding: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  timerAdjustCol: {
    alignItems: 'center',
    marginRight: 8,
  },
  timerAdjust: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  timerAdjustLabel: {
    fontSize: 12,
    color: '#333',
    marginVertical: 2,
  },
  timerDisplay: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  timerNextButton: {
    backgroundColor: '#388e3c',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginLeft: 8,
  },
  timerNextText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerStartButton: {
    backgroundColor: '#388e3c',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginLeft: 8,
  },
  timerStartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quitButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    elevation: 2,
  },
  quitButtonRed: {
    backgroundColor: '#b71c1c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    // Remove absolute positioning to match + Add Exercise
    // position: 'absolute',
    // top: 12,
    // right: 12,
    // zIndex: 10,
    elevation: 2,
    marginLeft: 8,
  },
  quitButtonRedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Popup modal styles (copied from ExercisesScreen)
  confirmOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 57, 57, 0.51)',
  },
  confirmContainerLeft: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'flex-start',
    width: '80%',
    alignSelf: 'center',
  },
  closeButton: {
    backgroundColor: '#b71c1c',
    padding: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    minWidth: 70,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
