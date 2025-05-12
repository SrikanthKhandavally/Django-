import { Alert, PageLoading, SmallPrimaryButton } from "@esi/ui-components";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from 'react-router-dom';
import patientActions from '../../../actions/PatientAction';
import { AddIcon } from "../../../assets/svg/addIcon-svg";
import { AppointSvg, AddPatientSvg } from "../../../assets/svg/section-svgs";
import AddressDetails from "./AddressDetails";
import styles from "./createAppointment.module.scss";
import ServiceBranchComponent from "./ServiceBranchList";
import service from "../../../services/AppointmentsService";
import AppointmentScheduleTime from "./AppointmentScheduleTime";
import RecurrencePattern from "../../../common/RecurrencePattern/RecurrencePattern";
import ModalPopup from "../../../common/Modal/ModalPopup";
import AddPatient from "./AddPatient";
import actions from "../../../actions/NurseAdministrationAction";
import ActivePatientTable from "./ActivePatientTable";
import { checkvalidAppointmentPeriod, convertTo12HoursFormat, Convertto24hrs, DurationFormart, getReccurenceValidations } from "../../nurses/NurseTimeAdministration/Helper";
import { addressConcatenation, compareTherapyArrays, convertToDateTime, DateFormat, formatDateTime, newDateFormatter } from "../../../utils/GlobalSearch";
import { useUserInfo } from "../../../utils/UserInfoContext";
import TherapyDetails from "./TherapyCard";
import { Saveicon, SaveiconGray } from "../../../assets/svg/appointmentTable-svg";
import userService from "../../../services/UserService";
import NotificationModal from "../../../common/Modal/NotificationModal";
import { useNotification } from "../../../utils/NotificationContext";
import ConflictRequestTime from "./ConflictRequestTime";
import AlertComponent from "../../../common/Alert/AlertComponent";
import { NurseCheckingPtAppointment } from "../../../utils/ValidateNurseAvailability";
import { onCalculateDailySchedule } from "../../../common/RecurrencePattern/DailyRecurrence";
import { onCalculateWeeklySchedule } from "../../../common/RecurrencePattern/WeeklyRecurrence";
import { onCalculateMonthlySchedule } from "../../../common/RecurrencePattern/MonthlyRecurrence";
import { DuplicateAppointmentsChecking } from "../../../utils/DuplicateAppintmentChecking";
import { TickIcon } from "../../../assets/svg/tick-svg";
import { alertErrorMessage, alertPropMessages, alertPropTypes } from "../../../constants/alertMessageConstants/AlertConstants";

const CreateNewAppointment = () => {
  const { lanId } = useUserInfo();
  const { notification, showNotification } = useNotification();
  const location = useLocation();
  const recurrenceRef = useRef();
  const addressRef = useRef();
  const serviceBranchRef = useRef();
  const appointmentSheduleRef = useRef();
  const dispatch = useDispatch();
  const [selectedServiceBranch, setSelectedServiceBranch] = useState("Select");
  const [stateListArray, setStateList] = useState([{}]);
  const [addressType, setAddressType] = useState("home");
  const [comments, setComments] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durType, setDurType] = useState("Hours");
  const [endByDate, setEndByDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [recurrencePattern, setRecurrencePattern] = useState("None");
  const [rangeOfRecurrence, setRangeOfRecurrence] = useState("EndAfter");
  const [occurence, setOccurence] = useState("");
  const [dailyField1, setDailyField1] = useState("");
  const [weeklyField1, setWeeklyField1] = useState("");
  const [monthlyField1, setMonthlyField1] = useState("");
  const [monthlyField2, setMonthlyField2] = useState("");
  const [monthlyField3, setMonthlyField3] = useState("");
  const [weekDay, setWeekDay] = useState('EveryWeekday');
  const [monthSelection, setMonthSelection] = useState("Date");
  const [selectedDay, setSelectedDay] = useState("9");
  const [selectDaySpecification, setSelectDaySpecification] = useState("1");
  const [selectedWeeklyRecDays, setSelectedWeeklyRecDays] = useState([]);
  const [timeType, setTimeType] = useState("");
  const [time24, setTime24] = useState("");
  const [ServiceBranchList, setServiceBranchList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [virtualVisit, setVirtualVisit] = useState(false);
  const [therapyIds, setTherapyIds] = useState([]);
  const [deviceIds, setDeviceIds] = useState([]);
  const [infusionIds, setInfusionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reasonCodes, setReasonCodes] = useState([]);
  const [selectedReasonCodeId, setSelectedReasonCodeId] = useState("Select");
  const [conflictTimeData, setConflictTimeData] = useState([]);
  const [conflictTimeErrorMessage, setConflictTimeErrorMessage] = useState("")
  const [therapyCodes, setTherapyCodes] = useState([]);
  const [resolveConflictTime, setResolveConflictTime] = useState(false);
  const [startTimeError, setStartTimeError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [durationError, setDurationError] = useState("");
  const [fullAddressObj, setFullAddressObj] = useState({});
  const [phoneNumberObj, setPhoneNumberObj] = useState({});
  const [occurenceError, setOccurenceError] = useState("");
  const [numberError, setNumberError] = useState("");
  const [recurrenceError, setRecurrenceError] = useState(false);
  const [diasbleSaveButton, setDisableSaveButton] = useState(false);
  const [therapyError, setTherapyError] = useState("");
  const [serviceBranchError, setServiceBranchError] = useState("");
  const [apiError, setApiError] = useState({});
  const [fullAddressError, setFullAddressError] = useState(false);
  const [reasonCodeError, setReasonCodeError] = useState("");
  const history = useHistory();
  const [notificationPopUp, setNotificationPopUp] = useState({
    isOpen: false,
    type: "",
    message: "",
  });
 
   /**Api call to retrieve Service Branch List */
  const ServiceBranch = async () => {
    try{
      let ServiceBranchCall = service.getServiceBranches();
    const yy = await ServiceBranchCall.then((res) => res);
    const response = yy.responseObj;
    setServiceBranchList(
      response?.map((item) => {
        return { value: item.name, key: item.srvBranchId };
      })
    );
    }
    catch(err) {
      setLoading(false);
      setApiError(err);
    }
    
  };
  useEffect(() => {
    /** Api calls to retrieve service branch list and state list */
    ServiceBranch();
    stateList();
    /** Api Calls to retrieve Edit Appointment Details */
    if (location?.state?.enableEdit) {
      if (location?.state?.appointmentStatus === "OPEN" || location?.state?.appointmentStatus === "UNASSGND") {
        dispatch(patientActions.fetchOpenAppointmentsDetails(location?.state?.appointmentId, "N")).catch((err) => {
          setApiError(err)
        });
      } else {
        dispatch(patientActions.fetchOpenAppointmentsDetails(location?.state?.appointmentId, "Y")).catch((err) => {
          setApiError(err)
        });
      }
      dispatch(patientActions.fetchReasonCodes("EditPtAppointmentReason")).catch((err) => setApiError(err));
    }

    /**Clearing all states When Navigating to Create appointment page. */
    if (location.state === undefined) {
      dispatch({ type: "NURSE-SCHEDULAR-UI/DELETE_EDIT_APPOINTMENT_DATA" });
      dispatch({ type: "NURSE-SCHEDULAR-UI/DELETE_REASON_CODES_DATA" });
      dispatch({ type: "NURSE-SCHEDULAR-UI/DELETE_PATIENT_THERAPY_DATA" });
      setSelectedServiceBranch("Select");
      setComments("");
      setDuration("");
      setDurType("hr");
      setStartDate("");
      setStartTime('');
      setAddressType("home");
      setTherapyIds([]);
      setDeviceIds([]);
      setInfusionIds([]);
      setVirtualVisit(false);
    }
    return () => {
      dispatch({ type: "NURSE-SCHEDULAR-UI/DELETE_PATIENT_THERAPY_DATA" });
      dispatch({ type: "NURSE-SCHEDULAR-UI/DELETE_EDIT_APPOINTMENT_DATA" });
      dispatch({ type: "NURSE-SCHEDULAR-UI/DELETE_REASON_CODES_DATA" });
    }
  }, [location.state]);

  const reasonCodeResponse = useSelector(state => state.reasonCodesReducer?.reasonCodes?.responseObj || []);
  const EditResponse = useSelector(state => state?.openAppointmentsDetailsReducer?.openAppointmentsDetails?.responseObj || {});
  
  /** setting patientData */
  const patientData = {
    dob: EditResponse?.patientInfo?.[0]?.dob,
    zip: EditResponse?.openAppointmentDetailsInfo?.[0]?.zipCode,
    extension: EditResponse?.openAppointmentDetailsInfo?.[0]?.workPhoneExt,
    state: EditResponse?.openAppointmentDetailsInfo?.[0]?.state,
    city: EditResponse?.openAppointmentDetailsInfo?.[0]?.city,
    firstName: EditResponse?.patientInfo?.[0]?.firstName,
    phoneNumber:
    EditResponse?.openAppointmentDetailsInfo?.[0]?.homePhone ||
    EditResponse?.openAppointmentDetailsInfo?.[0]?.cellPhone ||
    EditResponse?.openAppointmentDetailsInfo?.[0]?.workPhone,
    lastName: EditResponse?.patientInfo?.[0]?.lastName,
    patientId: EditResponse?.patientInfo?.[0]?.patientId,
    addressLine1: EditResponse?.openAppointmentDetailsInfo?.[0]?.addressLine1 || "",
    addressLine2: EditResponse?.openAppointmentDetailsInfo?.[0]?.addressLine2 || "",
    gender: EditResponse?.patientInfo?.[0]?.gender,
    englishSpeaker: EditResponse?.patientInfo?.[0]?.englishSpeaker,

  };

  const autoPopulateAllData = (data, therapyData, accessDeviceData, infusionsData, therapyTitles) => {
    const [date, time] = data?.[0]?.appointmentDate?.split(" ");
    const [yy, mm, dd] = date?.split("-");
    const [hh, m, s] = time?.split(":");
    setSelectedServiceBranch(data?.[0]?.srvBranchId);
    setComments(data?.[0]?.comment);
    if ((data?.[0]?.appointmentDuration) % 60 === 0) {
      setDuration(Math.floor(data?.[0]?.appointmentDuration / 60));
    } else {
      setDuration(data?.[0]?.appointmentDuration);
      setDurType("min");
    }
    setStartDate(`${mm}/${dd}/${yy}`);
    setStartTime(convertTo12HoursFormat(`${hh}:${m}`, setTimeType));
    setAddressType("override");
    setTherapyIds([...therapyData]);
    setDeviceIds([...accessDeviceData]);
    setInfusionIds([...infusionsData]);
    setVirtualVisit(data?.[0]?.virtualVisit);
    setTherapyCodes([...therapyTitles]);
  }
  /** Setting ReasonCodes */
  const reasonCodesCallback = () => {
    setReasonCodes(reasonCodeResponse?.map(item => { return { value: item?.reasonDescription, key: item?.reasonCodeId } }));
  }
  useEffect(() => {
    if (Object.keys(EditResponse)?.length !== 0 && location?.state?.enableEdit && reasonCodeResponse?.length !== 0) {
      reasonCodesCallback();
      const therapyTitles = EditResponse?.therapyInfo?.filter((item) => item.categoryName === "RxHomeNursingPatientTherapy")?.map(item => item?.code);
      const therapyData = EditResponse?.therapyInfo?.filter((item) => item.categoryName === "RxHomeNursingPatientTherapy")?.map(item => item?.mrequirementId);
      const accessDeviceData = EditResponse?.therapyInfo?.filter((item) => item.categoryName === "RxHomeNursingPatientDevices")?.map(item => item?.mrequirementId);
      const infusionsData = EditResponse?.therapyInfo?.filter((item) => item.categoryName === "RxHomeNursingPatientPumpInfusion")?.map(item => item?.mrequirementId);
      dispatch(patientActions.getPatientAppointmentTherapies(`patientId=${Number(EditResponse?.patientInfo?.[0]?.patientId)}`)).catch((err) => {
        setApiError(err)
      });
      autoPopulateAllData(EditResponse?.openAppointmentDetailsInfo, therapyData, accessDeviceData, infusionsData, therapyTitles);
    }
    /** Conflict Time Appointment Details Api Call */
    if (location?.state?.activityId === 123 && Object.keys(EditResponse)?.length !== 0) {
      const requestBody = {
        "patientId": EditResponse?.patientInfo?.[0]?.patientId,
        "startDateTime": EditResponse?.openAppointmentDetailsInfo?.[0]?.appointmentDate?.split(".")?.[0],
        "fvBeforeDupeTime": -12,
        "fvAfterDupeTime": 12,
        "appointmentId": location?.state?.appointmentId,
        "exceptionAppointmentId": location?.state?.appointmentId,
        "excludeEditAppointmentId": false,
        "patientActivityId": location?.state?.patientActivityId,
        "appointmentDuration": EditResponse?.openAppointmentDetailsInfo?.[0]?.appointmentDuration
      }
      conflictTime(requestBody);
    }
  }, [Object.keys(EditResponse)?.length, reasonCodeResponse?.length]);

  const conflictTime = async (body) => {
    const conflictApiCall = userService.putConflictTimeDetails(body);
    const conflictTimeResponse = await conflictApiCall.then((res) => res);
    setConflictTimeErrorMessage(conflictTimeResponse?.errorMessage);
    setConflictTimeData(conflictTimeResponse?.responseObj?.filter(item => item?.appointmentStatusCode === "REQSTD") || []);
  }

  /** Add Patient Api call Details*/
  const therapies = useSelector((state) => state.patientTherapyReducer?.patientTherapies || {});
  const patientId = therapies?.responseObj?.patientId;
  const stopDate = therapies?.responseObj?.stopDate;
  const therapyStopDate = (stopDate === null) ? null : stopDate?.split(" ")?.[0];

  /** Converting appointmentDuration into minutes */
  const dur = DurationFormart(duration, durType);
  /** Edit Appointment Details */
  const editObject = {
    "status": EditResponse?.openAppointmentDetailsInfo?.[0]?.appointmentStatus || null,
    "duration": EditResponse?.openAppointmentDetailsInfo?.[0]?.appointmentDuration,
    "dateTimeString": EditResponse?.openAppointmentDetailsInfo?.[0]?.appointmentDate?.split(".")?.[0]?.replace(" ", "T"),
    "srvBranchId": EditResponse?.openAppointmentDetailsInfo?.[0]?.srvBranchId,
    "appointmentId": EditResponse?.openAppointmentDetailsInfo?.[0]?.appointmentId || -1
  }

  /** Api call to retrieve State List */
  const stateList = async () => {
    try{
      const stateApiCall = userService.getStateList();
      const stateResponse = await stateApiCall.then(res => res);
      setStateList(
        stateResponse?.responseObj?.map(item => {
          return { value: item?.description, key: item?.lookupCode }
        })
      )
    }
    catch(err) {
      setLoading(false);
      setApiError(err);
    }
  }

  useEffect(() => {
    if (ServiceBranchList.length !== 0 && stateListArray.length !== 0) {
      setLoading(false);
    }
  },
    [ServiceBranchList.length, stateListArray.length]);

  /** Converting Start Time into 24 hrs */
  useEffect(() => {
    setTime24(Convertto24hrs(startTime, timeType));
  }, [startTime, timeType]);
  const DateTime = `${DateFormat(startDate)} ${time24}:00`;

  /** Recurrence Dates Calculations */
  const RecurrenceCondition = () => {
    if (recurrencePattern === "None" || Object.keys(EditResponse).length !== 0) {
      return [DateTime];
    }
    if (recurrenceRef.current.checkRecurrenceValidations() && Object.keys(EditResponse).length === 0) {
      if (recurrencePattern === "Daily") {
        return onCalculateDailySchedule(time24, weekDay, rangeOfRecurrence, startDate, occurence, endByDate, dailyField1);
      }
      if (recurrencePattern === "Weekly") {
        return onCalculateWeeklySchedule(time24, occurence, startDate, rangeOfRecurrence, endByDate, selectedWeeklyRecDays, weeklyField1);
      }
      if (recurrencePattern === "Monthly") {
        return onCalculateMonthlySchedule(time24, occurence, endByDate, startDate, monthSelection, rangeOfRecurrence, monthlyField1, monthlyField2, monthlyField3, selectedDay, selectDaySpecification, setNotificationPopUp);
      }
    }
  };
  /** Add Patient Popup title */
  const AddPatientTitle = () => (
    <span className={styles.addPatientIcon}>
      <AddPatientSvg /> &nbsp;&nbsp;Add Patient
    </span>
  );
  const handleAddPatient = () => {
    setIsOpen(!isOpen);
  };

  const onNavigateEditing = () => {
    sessionStorage.setItem('fromPage', 'editedNurseAppointment');
    history.goBack();
  };
  let enableCreateAppointment = false;

  /** All validations and save appointment functionalities */
  const handleSaveClick = async () => {
    setDisableSaveButton(true);
    const fieldsCheck1 = serviceBranchRef.current.validateServiceBranch();
    const fieldCheck2 = appointmentSheduleRef.current?.ValidateDateTime();
    const fieldCheck3 = addressRef.current.checkAddressValidations();
    const fieldCheck4 = addressRef.current.phoneNumberValidations();
    if(location.state === undefined){
      recurrenceRef.current.checkRecurrenceValidations();
    }
    if (fullAddressObj?.latitude === undefined || fullAddressObj?.longitude === undefined) {
      
      setFullAddressObj({
        ...fullAddressObj,
        "latitude": 0,
        "longitude": 0,
      })
      // setNotificationPopUp({
      //   isOpen: true,
      //   type: "Warning",
      //   message: `GeoCode was not successful for address ${addressConcatenation(fullAddressObj)} due to the following reason : ZERO_RESULTS.
      //   No Appointments available for this location. Please select the valid appointment address.`,
      // });
      // return false;
    }
    let ReasonCodesCheck = true;
    if (dur && (dur < 15 || dur > 900)) {
      setDurationError("Please Enter Valid Duration");
      setNotificationPopUp({
        isOpen: true,
        type: "Warning",
        message: "The Allowed Appointment Duration is between  15 Mins to 15 Hours",
      });
      return false;
    }
    if (startTime?.length === 4) {
      setStartTimeError("InValid Time Format( use HH:MM format)");
      return false;
    }
    if (Object.keys(therapies)?.length === 0) {
      setNotificationPopUp({
        isOpen: true,
        type: "Warning",
        message: "Please add Patient",
      });
      return false;
    }
    if (fieldsCheck1 && Object.keys(therapies)?.length !== 0 && therapyIds?.length === 0) {
      setTherapyError("Please select therapy")
      setNotificationPopUp({
        isOpen: true,
        type: "Warning",
        message: "Please select therapy",
      });
      return false;
    }
    const date1 = new Date(DateTime?.replace(" ", "T"));
    const date2 = new Date(editObject?.dateTimeString);

    if (location.state !== undefined && (date1.getTime() !== date2.getTime())) {
      ReasonCodesCheck = serviceBranchRef.current.validateReasonCodes();
      if (!ReasonCodesCheck) {
        setNotificationPopUp({
          isOpen: true,
          type: "Warning",
          message: "Please select Reason Code",
        });
        return false;
      }
    }
    if (location?.state?.enableEdit && location?.state?.appointmentStatus !== "OPEN" && editObject?.status !== "UNASSGND" && (Number(selectedServiceBranch) !== editObject?.srvBranchId)) {
      setNotificationPopUp({
        isOpen: true,
        type: "Warning",
        message: "Nurse(s) must be unassigned first before appointment can be transferred to another Service Branch",
      });
      return false;
    }
    /** Max allowed Recurrence Dates Conditions */
    if (recurrencePattern === "Monthly") {
      if ((monthlyField2?.length !== 0 && ((Number(occurence) * Number(monthlyField2)) > 7))) {
        setDisableSaveButton(false);
        setNotificationPopUp({
          isOpen: true,
          type: "Warning",
          message: "Please select Recurrence Dates less than 7 months for Appointments Creation",
        });
        return false;
      } else if (((Number(occurence) * Number(monthlyField3)) > 7)) {
        setNotificationPopUp({
          isOpen: true,
          type: "Warning",
          message: "Please select Recurrence Dates less than 7 months for Appointments Creation",
        });
        return false;
      }
    }
    if(recurrencePattern === "Weekly" || recurrencePattern === "Daily" ){
      if(weeklyField1?.length !== 0 && ((Number(occurence) * Number(weeklyField1)) > 30)){
        setNotificationPopUp({
          isOpen: true,
          type: "Warning",
          message: "Please select Valid Occurences for Selecting Recurrence Dates",
        });
        return false;
      }
      if(recurrencePattern === "Daily" && (dailyField1?.length !== 0 || dailyField1 !== "") && ((Number(dailyField1) * Number(occurence)) > 184) ){
        setNotificationPopUp({
          isOpen: true,
          type: "Warning",
          message: "Please select Valid Occurences for Selecting Recurrence Dates",
        });
        return false;
      }

    }
    if ( location?.state === undefined && endByDate?.length === 10 && startDate?.length === 10) {
      /** Differnce between StartDate and EndDate Calculations. */
      const startDateAndEndDateDiff = new Date(newDateFormatter(endByDate)) - new Date(startDate);
      const differenceInDays = Math.floor(startDateAndEndDateDiff / (1000 * 60 * 60 * 24));
       if (differenceInDays > 180) {
        setNotificationPopUp({
          isOpen: true,
          type: "Warning",
          message: "Please select Recurrence Dates less than 6 months ",
        });
        return false;
      }
    }
    if (fieldsCheck1 && fieldCheck2 && fieldCheck3 && (therapyIds.length !== 0) && fieldCheck4 && ReasonCodesCheck && !fullAddressError) {
      const recurrenceSelectionDates = RecurrenceCondition();
      if (Array.isArray(recurrenceSelectionDates) && recurrenceSelectionDates?.length !== 0) {
        let AddressDetailsBoolean;
        if (!Boolean(location?.state?.patientActivityId) && therapyStopDate && (new Date(newDateFormatter(recurrenceSelectionDates[recurrenceSelectionDates?.length - 1]?.split(" ")?.[0])) > new Date(newDateFormatter(therapyStopDate)))) {
          AddressDetailsBoolean = confirm(`Visit date after POT end date ${newDateFormatter(therapyStopDate)}. 
    Are there interim orders?`);
          if(!AddressDetailsBoolean){
            setDisableSaveButton(false);
          }
        } else {
          AddressDetailsBoolean = true;
        }
        if (AddressDetailsBoolean) {
          setDisableSaveButton(true);
          if (!Boolean(location?.state?.patientActivityId)) {
            /** Patient Duplicate Appointments Checking Api Call.*/
            enableCreateAppointment = await DuplicateAppointmentsChecking(dur, patientId, recurrenceSelectionDates, editObject?.appointmentId, setNotificationPopUp);
            if(!enableCreateAppointment){
              setDisableSaveButton(false);
            }
          } else {
            enableCreateAppointment = true;
          }
          if (enableCreateAppointment) {
            setDisableSaveButton(true);
            let booleanCheck = true;
            const selectedNurseIds = EditResponse?.nurseInfo?.map((item) => item?.nurseId) || [];
            if (!Boolean(location?.state?.patientActivityId) && location.state !== undefined && editObject?.status !== "OPEN" && editObject?.status !== "UNASSGND" && selectedNurseIds?.length !== 0) {
              /** Validating Nurse Availability Api Call */
              booleanCheck = await NurseCheckingPtAppointment(setNotificationPopUp, EditResponse?.nurseInfo, selectedNurseIds, DateTime, dur, editObject?.appointmentId, 1, "Patient");
              if(!booleanCheck){
                setDisableSaveButton(false)
              }
            }
            const requestBodydata = {
              appointmentId: location?.state?.appointmentId || -1,
              isPatientAppointment: true,
              patientInfo: [{ "id": therapies?.responseObj?.patientId }],
              reqIds: [...therapyIds, ...deviceIds, ...infusionIds],
              startDateTime: DateTime,
              duration: DurationFormart(duration, durType),
              eventDescription: comments,
              flexible: null,
              virtualVisit: virtualVisit,
              srvBranchId: selectedServiceBranch,
              recurrenceDates: recurrenceSelectionDates,
              appointmentAddress: fullAddressObj,
              appointmentPhone: phoneNumberObj,
              mappointmentReasonCodeId: (selectedReasonCodeId === "Select") ? null : Number(selectedReasonCodeId),
              appointmentStatusCode: (selectedReasonCodeId === "Select") ? null : editObject?.status,
              therapyCode: "appointment",
              appointmentTypeId: 1,
              patientActivityId: location?.state?.patientActivityId || null,
              conflictRequested: resolveConflictTime
            };
            if (booleanCheck && fullAddressObj?.latitude !== undefined && fullAddressObj?.longitude !== undefined) {
              dispatch(actions.postCreateAppointment(requestBodydata, lanId))
                .then(() => {
                  if (location.state !== undefined && location?.state?.patientActivityId) {
                    history.push("/");
                    sessionStorage.setItem('conflict', "Resolved");
                    if (location.state.activityId === 121) {
                      showNotification("Conflict Location Appointment Resolved", "info");
                    }
                    else if (location.state.activityId === 122) {
                      showNotification("Conflict Therapy Appointment Resolved", "info");
                    }
                    else {
                      showNotification("Conflict Time Appointment Resolved", "info");
                    }
                  }
                  else if (location.state !== undefined && location?.state?.patientDetailsRoutepath === "patientDetails") {
                    history.push("/patient/search/patient-details", { state: patientData });
                    showNotification("Appointment Updated Successfully", "info");
                  }
                  else if ((location.state === undefined || location?.state?.appointmentStatus === "OPEN" || location?.state?.appointmentStatus === "UNASSGND") && booleanCheck) {
                    sessionStorage.setItem('currentDate', DateTime);
                    history.push("/appointment/open-appointment");
                    if (location.state !== undefined) {
                      showNotification("Appointment Updated Successfully", "info");
                    } else {
                      showNotification("Appointment Created Successfully", "info");
                    }
                  }
                  else if (booleanCheck && location?.state?.appointmentStatus !== "OPEN" && location?.state?.appointmentStatus !== "UNASSGND") {
                    sessionStorage.setItem("weekStartDate", newDateFormatter(recurrenceSelectionDates?.[0]?.split(" ")?.[0]));
                    sessionStorage.setItem("nurseApptCurrentDate", new Date(newDateFormatter(recurrenceSelectionDates?.[0]?.split(" ")?.[0])));
                    location?.state?.from === "nurseAppointments" ?
                      onNavigateEditing()
                      : history.push("/nurse/nurse-availability")
                      showNotification("Appointment Updated Successfully", "info");
                  }
                })
                .catch((err) => {
                  setDisableSaveButton(false);
                  setNotificationPopUp({
                    isOpen: true,
                    type: "Error",
                    message: `Failed to Save the Appointments. ${err?.errorMessage || " Sorry for Inconvience. Resolving the issue ASAP."}`,
                  });
                })
            }
          }
        }
      } else if(recurrenceSelectionDates?.length === 0 || (new Date(startDate) === new Date(endByDate))) {
        setDisableSaveButton(false);
        setNotificationPopUp({
          isOpen: true,
          type: alertPropTypes?.WARNING,
          message: alertPropMessages?.INVALID_RECURRENCES,
        });
        return false;
      }
    }
  };

  useEffect(() => {
    if (serviceBranchError?.length !==0 || startDateError?.length !== 0 || durationError?.length !==0 || startTimeError?.length !==0 || reasonCodeError?.length !== 0) {
      setDisableSaveButton(true);
    } else {
      setDisableSaveButton(false);
    }
    if (Object.keys(therapies)?.length !== 0 && therapyIds?.length === 0) {
      setTherapyError("Please select therapy");
    }
    if (serviceBranchError === "" && startDateError === "" && startTimeError === "" && durationError === "" && therapyIds?.length !== 0 && (location.state === undefined ? (recurrencePattern === "None" ? true : ( !recurrenceError && occurenceError?.length === 0)) : true)) {
      setDisableSaveButton(false);
    }
  }, [ selectedServiceBranch, startDateError, startTimeError, durationError, numberError, therapies, therapyIds, fullAddressError, reasonCodeError, recurrenceError, recurrencePattern]);

  /** Updating Virtual State */
  const handleVirtualvisit = (newState) => {
    setVirtualVisit(newState);
  }

        // useEffect(() => {
        //   if (Object.keys(EditResponse)?.length !== 0 && stateListArray.length !== 0) {
        //     const editResponseData = EditResponse?.openAppointmentDetailsInfo?.[0];
        //     const therapyData = EditResponse?.therapyInfo?.filter((item) => item.categoryName === "RxHomeNursingPatientTherapy")?.map(item => item?.mrequirementId);
        //     const accessDeviceData = EditResponse?.therapyInfo?.filter((item) => item.categoryName === "RxHomeNursingPatientDevices")?.map(item => item?.mrequirementId);
        //     const infusionsData = EditResponse?.therapyInfo?.filter((item) => item.categoryName === "RxHomeNursingPatientPumpInfusion")?.map(item => item?.mrequirementId);
        //     const validZipCode = (editResponseData?.zipCode?.replaceAll("_", "")?.length > 7) ? editResponseData?.zipCode : `${editResponseData?.zipCode}-____`;

        //     const onEditCondition = editResponseData?.srvBranchId === selectedServiceBranch
        //       && editResponseData?.comment === comments
        //       && editResponseData?.virtualVisit === virtualVisit
        //       && editResponseData?.addressLine1 === fullAddressObj?.addressLine1
        //       && editResponseData?.addressLine2 === fullAddressObj?.addressLine2
        //       && editResponseData?.city === fullAddressObj?.city
        //       && editResponseData?.state === fullAddressObj?.state
        //       && validZipCode === fullAddressObj?.zip
        //       && (editResponseData?.homePhone || "") === phoneNumberObj?.homePhone
        //       && (editResponseData?.workPhone || "") === phoneNumberObj?.workPhone
        //       && (editResponseData?.cellPhone || "") === phoneNumberObj?.cellPhone
        //       && (editResponseData?.workPhoneExt || "") === (phoneNumberObj?.extension || "")
        //       &&  startDate !== undefined && editResponseData?.appointmentDate === convertToDateTime(startDate, startTime, timeType)
        //       && editResponseData?.appointmentDuration === dur
        //       && compareTherapyArrays(therapyData, therapyIds)
        //       && compareTherapyArrays(accessDeviceData, deviceIds)
        //       && compareTherapyArrays(infusionsData, infusionIds);

        //     // if ( Object.keys(EditResponse)?.length !== 0 && startDate !== undefined && editResponseData?.appointmentDate === convertToDateTime(startDate, startTime, timeType)) {
        //     //   setReasonCodeError("");
        //     // }
        //     if (onEditCondition) {
        //       setDisableSaveButton(true);
        //     } else {
        //       setDisableSaveButton(false);
        //     }
        //   }
        // }, [Object.keys(EditResponse)?.length, selectedServiceBranch, comments, virtualVisit, fullAddressObj, phoneNumberObj, startDate, startTime, timeType, dur, therapyIds, deviceIds, infusionIds, fullAddressError]);
  return (
    <>
      {loading && <PageLoading waitMessage='Loading...' />}
      {Object.keys(apiError)?.length !== 0 &&
        <Alert
          type={alertPropTypes?.ERROR}
          title={alertErrorMessage(apiError?.errorMessage)}
        />
      }
      {Object.keys(apiError)?.length === 0 &&
        <div className={styles.container}>
          <div className={styles.headerBlock}>
            <div className={styles.appSvg}>
              <AppointSvg />
              {Object.keys(EditResponse)?.length !== 0 ?
                <div>Edit Appointment</div>
                :
                <div>Create New Appointment</div>
              }
            </div>
            {(Object.keys(EditResponse).length === 0) &&
              <SmallPrimaryButton
                className={styles.button}
                onClick={handleAddPatient}
              >
                <AddIcon />
                <div> Add Patient </div>
              </SmallPrimaryButton>
            }
            {isOpen && (
              <ModalPopup
                width={"70%"}
                title={<AddPatientTitle />}
                onClose={() => {
                  setIsOpen(false);
                }}
              >
                <div className={styles.modal}>
                  <AddPatient
                    setIsOpen={setIsOpen}
                    isOpen={isOpen}
                    startDate={startDate}
                  />
                </div>
              </ModalPopup>
            )}
          </div>
          {(location?.state?.activityId === 123) &&
            <div className={styles.patientTableContainer}>
              <ConflictRequestTime
                conflictTimeData={conflictTimeData}
                therapyCodes={therapyCodes}
                conflictTimeErrorMessage={conflictTimeErrorMessage}
                setResolveConflictTime={setResolveConflictTime}
              />
            </div>
          }
          <ServiceBranchComponent
            ServiceBranches={ServiceBranchList}
            setAddressType={setAddressType}
            setComments={setComments}
            addressType={addressType}
            setSelectedServiceBranch={setSelectedServiceBranch}
            selectedServiceBranch={selectedServiceBranch}
            comments={comments}
            ref={serviceBranchRef}
            setVirtualVisit={setVirtualVisit}
            onVirtualClick={handleVirtualvisit}
            reasonCodesList={reasonCodes}
            reasonCodeId={selectedReasonCodeId}
            setSelectedReasonCodeId={setSelectedReasonCodeId}
            disbaleAddressTypes={location?.state?.enableEdit || false}
            virtualVisit={virtualVisit}
            conflictAppointments={location?.state?.patientActivityId || false}
            setLoading={setLoading}
            setServiceBranchError={setServiceBranchError}
            serviceBranchError={serviceBranchError}
            setReasonCodeError={setReasonCodeError}
            reasonCodeError={reasonCodeError}
            setDisableSaveButton = {setDisableSaveButton}
          />
          {Object.keys(therapies).length !== 0 && <ActivePatientTable data={therapies?.responseObj} />}
          <AddressDetails
            data={therapies?.responseObj}
            isOpen={isOpen}
            ref={addressRef}
            addressType={addressType}
            listOfStates={stateListArray}
            editAddress={(Object.keys(EditResponse)?.length !== 0 && (location.state !== undefined)) ? EditResponse?.openAppointmentDetailsInfo : []}
            nurseData={(Object.keys(EditResponse)?.length !== 0 && (location.state !== undefined)) ? EditResponse?.nurseInfo : []}
            patientData={(Object.keys(EditResponse)?.length !== 0 && (location.state !== undefined)) ? EditResponse?.patientInfo : [therapies?.responseObj]}
            setFullAddressObj={setFullAddressObj}
            setPhoneNumberObj={setPhoneNumberObj}
            numberError={numberError}
            setNumberError={setNumberError}
            setFullAddressError={setFullAddressError}
          />
          {Object.keys(therapies).length !== 0 &&
            <TherapyDetails
              data={therapies}
              therapyIds={therapyIds}
              setTherapyIds={setTherapyIds}
              infusionIds={infusionIds}
              setInfusionIds={setInfusionIds}
              deviceIds={deviceIds}
              setDeviceIds={setDeviceIds}
              therapyCodes={therapyCodes}
              therapyError={therapyError}
            />}
          <AppointmentScheduleTime
            startDate={startDate}
            setStartDate={setStartDate}
            setDurType={setDurType}
            durType={durType}
            startTime={startTime}
            setStartTime={setStartTime}
            duration={duration}
            setDuration={setDuration}
            setTimeType={setTimeType}
            timeType={timeType}
            ref={appointmentSheduleRef}
            setStartTimeError={setStartTimeError}
            startTimeError={startTimeError}
            startDateError={startDateError}
            setStartDateError={setStartDateError}
            durationError={durationError}
            setDurationError={setDurationError}
            setDisableSaveButton ={setDisableSaveButton}
          />
          {(location.state === undefined) &&
            <div className={styles.recurrenceContainer}>
              <RecurrencePattern
                ref={recurrenceRef}
                startDate={startDate}
                setEndByDate={setEndByDate}
                endByDate={endByDate}
                recurrencePattern={recurrencePattern}
                setRecurrencePattern={setRecurrencePattern}
                setOccurence={setOccurence}
                occurence={occurence}
                isPatientAppointment={true}
                rangeOfRecurrence={rangeOfRecurrence}
                setRangeOfRecurrence={setRangeOfRecurrence}
                setDailyField1={setDailyField1}
                dailyField1={dailyField1}
                weeklyField1={weeklyField1}
                weekDay={weekDay}
                setWeeklyField1={setWeeklyField1}
                monthlyField1={monthlyField1}
                setMonthlyField1={setMonthlyField1}
                monthlyField2={monthlyField2}
                setMonthlyField2={setMonthlyField2}
                monthlyField3={monthlyField3}
                setMonthlyField3={setMonthlyField3}
                setWeekDay={setWeekDay}
                setMonthSelection={setMonthSelection}
                monthSelection={monthSelection}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                selectDaySpecification={selectDaySpecification}
                setSelectDaySpecification={setSelectDaySpecification}
                selectedWeeklyRecDays={selectedWeeklyRecDays}
                setSelectedWeeklyRecDays={setSelectedWeeklyRecDays}
                occurenceError={occurenceError}
                setOccurenceError={setOccurenceError}
                setRecurrenceError = {setRecurrenceError}
              />
            </div>
          }
          <div className={styles.saveButton}>
            <SmallPrimaryButton
              className={styles.button}
              onClick={handleSaveClick}
              isDisabled = {diasbleSaveButton || fullAddressError || (recurrencePattern === "None" ? false : recurrenceError) || (location.state !== undefined ? reasonCodeError?.length !== 0 : false)}
            >
              {/* <div> &nbsp; Save </div> */}
              {Object.keys(EditResponse)?.length !== 0 ?
                <div><Saveicon className={styles.imgIcon} /> Save</div>
                :
                <div><TickIcon className={styles.imgIcon} /> Create Appointment</div>
              }
            </SmallPrimaryButton>
          </div>
        </div>
      }
      {notificationPopUp?.isOpen && (
        <NotificationModal
          type={notificationPopUp?.type}
          width="35%"
          top="10rem"
          onClose={() => {
            setNotificationPopUp({
              isOpen: false,
              type: "",
              message: "",
            });
          }}
          message={notificationPopUp?.message}
        />
      )}
      {notification?.isNotification && <AlertComponent title={notification?.notificationMessage} type={notification?.notificationType} />}
    </>
  );
};
export default CreateNewAppointment;
