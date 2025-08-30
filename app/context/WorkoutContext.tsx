import React, { createContext, useContext, useState } from 'react';

type WorkoutContextType = {
  workoutActive: boolean;
  setWorkoutActive: (active: boolean) => void;
};

const WorkoutContext = createContext<WorkoutContextType>({
  workoutActive: false,
  setWorkoutActive: () => {},
});

export const WorkoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [workoutActive, setWorkoutActive] = useState(false);
  return (
    <WorkoutContext.Provider value={{ workoutActive, setWorkoutActive }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkoutContext = () => useContext(WorkoutContext);