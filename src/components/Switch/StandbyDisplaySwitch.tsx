import { useCharacteristics } from "../../provider/CharacteristicsProvider";
import { FaSolidLightbulb } from 'solid-icons/fa'
import { Switch } from "./Switch";
import { useTranslations } from "../../i18n/utils";


export const StandbyDisplaySwitch = () => {

  const t = useTranslations();

  const {
    getters: {
      isDisplayOnCooling
    },
    setters: {
      setDisplayOnCoolingOn,
      setDisplayOnCoolingOff,
    },
  } = useCharacteristics();


  const toggleSwitch = (isOn: boolean) => {
    if(isOn) {
      setDisplayOnCoolingOn()
    } else {
      setDisplayOnCoolingOff()
    }
  };

  return (
    <Switch label={t('standbyLight')} onToggle={toggleSwitch} isOn={isDisplayOnCooling()} icon={<FaSolidLightbulb size="18px"/>}/>
  );
}