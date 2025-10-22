import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { MediaDeviceInfo } from "../types";
import { LAST_MICROPHONE_KEY } from "../constants";

export const useMicrophoneDevices = () => {
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const getMicrophones = async () => {
      try {
        console.log("Requesting microphone permissions and fetching devices");
        
        // First, request microphone permission to get device labels
        let permissionGranted = false;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          permissionGranted = true;
          // Stop the stream immediately, we just needed permission
          stream.getTracks().forEach(track => track.stop());
          console.log("Microphone permission granted");
        } catch (permError) {
          console.warn("Microphone permission not granted yet:", permError);
        }
        
        // Now enumerate devices - will have labels if permission granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("All devices found:", devices);
        
        const audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );
        
        // Filter out devices with empty deviceId (shouldn't happen after permission)
        const validMicrophones = audioDevices.filter(device => device.deviceId && device.deviceId !== '');
        
        if (validMicrophones.length === 0 && audioDevices.length > 0) {
          console.warn("Found microphones but no valid deviceIds. Permission may not be granted.");
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access to use audio recording.",
          });
          return;
        }
        
        setMicrophones(validMicrophones);
        console.log("Available microphones:", validMicrophones);

        // Set initial microphone selection
        const lastSelectedMicrophone = localStorage.getItem(LAST_MICROPHONE_KEY);
        const isLastMicrophoneAvailable = validMicrophones.some(
          (device) => device.deviceId === lastSelectedMicrophone
        );

        if (lastSelectedMicrophone && isLastMicrophoneAvailable) {
          setSelectedMicrophone(lastSelectedMicrophone);
          console.log("Restored last selected microphone:", lastSelectedMicrophone);
        } else if (validMicrophones.length > 0) {
          setSelectedMicrophone(validMicrophones[0].deviceId);
          console.log("Selected first available microphone:", validMicrophones[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting microphones:", error);
        toast({
          variant: "destructive",
          title: "Microphone Access Error",
          description: "Could not access microphone. Please check permissions.",
        });
      }
    };

    getMicrophones();
  }, [toast]);

  useEffect(() => {
    if (selectedMicrophone) {
      localStorage.setItem(LAST_MICROPHONE_KEY, selectedMicrophone);
      console.log("Saved selected microphone to localStorage:", selectedMicrophone);
    }
  }, [selectedMicrophone]);

  return {
    microphones,
    selectedMicrophone,
    setSelectedMicrophone,
  };
};
