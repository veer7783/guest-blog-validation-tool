declare module '@mui/icons-material' {
  import { SvgIconProps } from '@mui/material';
  import { ComponentType } from 'react';
  
  export const Menu: ComponentType<SvgIconProps>;
  export const Dashboard: ComponentType<SvgIconProps>;
  export const CloudUpload: ComponentType<SvgIconProps>;
  export const Storage: ComponentType<SvgIconProps>;
  export const People: ComponentType<SvgIconProps>;
  export const Logout: ComponentType<SvgIconProps>;
  export const CheckCircle: ComponentType<SvgIconProps>;
  export const Download: ComponentType<SvgIconProps>;
}

declare module '@mui/icons-material/RemoveRedEye' {
  import { SvgIconProps } from '@mui/material';
  import { ComponentType } from 'react';
  const RemoveRedEyeIcon: ComponentType<SvgIconProps>;
  export default RemoveRedEyeIcon;
}

declare module '@mui/icons-material/Edit' {
  import { SvgIconProps } from '@mui/material';
  import { ComponentType } from 'react';
  const EditIcon: ComponentType<SvgIconProps>;
  export default EditIcon;
}

declare module '@mui/icons-material/Delete' {
  import { SvgIconProps } from '@mui/material';
  import { ComponentType } from 'react';
  const DeleteIcon: ComponentType<SvgIconProps>;
  export default DeleteIcon;
}
