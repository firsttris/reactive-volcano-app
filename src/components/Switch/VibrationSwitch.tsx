import { useCharacteristics } from "../../provider/CharacteristicsProvider";
import { BsPhoneVibrate } from 'solid-icons/bs'
import { Switch } from "./Switch";
import { useTranslations } from "../../i18n/utils";


export const VibrationSwitch = () => {

  const t = useTranslations();

  const {
    getters: {
      isVibrationOn
    },
    setters: {
      setVibrationOff,
      setVibrationOn,
    },
  } = useCharacteristics();


  const toggleSwitch = (isOn: boolean) => {
    if(isOn) {
      setVibrationOn()
    } else {
      setVibrationOff()
    }
  };

  return (
    <Switch label={t('vibration')} onToggle={toggleSwitch} isOn={isVibrationOn()} icon={<BsPhoneVibrate size="18px"/>}/>
  );
}