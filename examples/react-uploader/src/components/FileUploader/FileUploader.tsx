import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as LR from '@uploadcare/blocks';
import { OutputFileEntry } from '@uploadcare/blocks';
import blocksStyles from '@uploadcare/blocks/web/lr-file-uploader-regular.min.css?url';

import st from './FileUploader.module.scss';
import cssOverrides from './FileUploader.overrides.css?inline';
import cs from 'classnames';

LR.registerBlocks(LR);

type FileUploaderProps = {
  uploaderClassName: string;
  files: OutputFileEntry[];
  onChange: (files: OutputFileEntry[]) => void;
  theme: 'light' | 'dark';
}

export default function FileUploader({ files, uploaderClassName, onChange, theme }: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<OutputFileEntry<'success'>[]>([]);
  const ctxProviderRef = useRef<InstanceType<LR.UploadCtxProvider>>(null);
  const configRef = useRef<InstanceType<LR.Config>>(null);

  const handleRemoveClick = useCallback(
    (uuid: OutputFileEntry['uuid']) => onChange(files.filter(f => f.uuid !== uuid)),
    [files, onChange],
  );

  useEffect(() => {
    /*
      Note: File Uploader styles are scoped due to ShadowDOM usage.
      There are two ways to override them. One way is used on the line below,
      another one is to set a custom class to File Uploader,
      and use CSS variables to update styles.

      See more: https://uploadcare.com/docs/file-uploader/styling/
     */
    LR.FileUploaderRegular.shadowStyles = cssOverrides;

    return () => {
      /*
        Note: We're resetting styles here just to be sure they do not affect other examples.
        You probably do not need to do it in your app.
       */
      LR.FileUploaderRegular.shadowStyles = '';
    }
  }, []);

  useEffect(() => {
    const ctxProvider = ctxProviderRef.current;
    if (!ctxProvider) return;

    const handleChangeEvent = (e: LR.EventMap['change']) => {
      setUploadedFiles([...e.detail.allEntries.filter(f => f.status === 'success')] as OutputFileEntry<'success'>[]);
    };

    /*
      Note: Event binding is the main way to get data and other info from File Uploader.
      There plenty of events you may use.

      See more: https://uploadcare.com/docs/file-uploader/events/
     */
    ctxProvider.addEventListener('change', handleChangeEvent);
    return () => {
      ctxProvider.removeEventListener('change', handleChangeEvent);
    };
  }, [setUploadedFiles]);

  useEffect(() => {
    const config = configRef.current;
    if (!config) return;

    /*
     Note: Localization of File Uploader is done via DOM property on the config node.
     You can change any piece of text of File Uploader this way.

     See more: https://uploadcare.com/docs/file-uploader/localization/
    */
    config.localeDefinitionOverride = {
      en: {
        'photo__one': 'photo',
        'photo__many': 'photos',
        'photo__other': 'photos',

        'upload-file': 'Upload photo',
        'upload-files': 'Upload photos',
        'choose-file': 'Choose photo',
        'choose-files': 'Choose photos',
        'drop-files-here': 'Drop photos here',
        'select-file-source': 'Select photo source',
        'edit-image': 'Edit photo',
        'no-files': 'No photos selected',
        'caption-edit-file': 'Edit photo',
        'files-count-allowed': 'Only {{count}} {{plural:photo(count)}} allowed',
        'files-max-size-limit-error': 'Photo is too big. Max photo size is {{maxFileSize}}.',
        'header-uploading': 'Uploading {{count}} {{plural:photo(count)}}',
        'header-succeed': '{{count}} {{plural:photo(count)}} uploaded',
        'header-total': '{{count}} {{plural:photo(count)}} selected',
      }
    }
    return () => {
      config.localeDefinitionOverride = null;
    };
  }, [setUploadedFiles]);

  useEffect(() => {
    const ctxProvider = ctxProviderRef.current;
    if (!ctxProvider) return;

    /*
      Note: Here we use provider's API to reset File Uploader state.
      It's not necessary though. We use it here to show users
      a fresh version of File Uploader every time they open it.

      Another way is to sync File Uploader state with an external store.
      You can manipulate File Uploader using API calls like `addFileFromObject`, etc.

      See more: https://uploadcare.com/docs/file-uploader/api/
     */
    const resetUploaderState = () => ctxProviderRef.current?.uploadCollection.clearAll();

    const handleModalCloseEvent = () => {
      resetUploaderState();

      onChange([...files, ...uploadedFiles]);
      setUploadedFiles([]);
    };

    ctxProvider.addEventListener('modal-close', handleModalCloseEvent);

    return () => {
      ctxProvider.removeEventListener('modal-close', handleModalCloseEvent);
    };
  }, [files, onChange, uploadedFiles, setUploadedFiles]);

  return (
    <div className={st.root}>
      {/*
         Note: `lr-config` is the main block we use to configure File Uploader.
         It's important to all the context-related blocks to have the same `ctx-name` attribute.

         See more: https://uploadcare.com/docs/file-uploader/configuration/
         Available options: https://uploadcare.com/docs/file-uploader/options/

         Also note: Some options currently are not available via `lr-config`,
         but may be set via CSS properties. E.g. `darkmode`.

         Here they are: https://github.com/uploadcare/blocks/blob/main/blocks/themes/lr-basic/config.css
      */}
      <lr-config
        ref={configRef}
        ctx-name="my-uploader"
        pubkey="a6ca334c3520777c0045"
        multiple={true}
        sourceList="local, url, camera, dropbox, gdrive"
        confirmUpload={false}
        removeCopyright={true}
        imgOnly={true}
      ></lr-config>

      <lr-file-uploader-regular
        ctx-name="my-uploader"
        css-src={blocksStyles}
        class={cs(uploaderClassName, { [st.darkModeEnabled]: theme === 'dark' })}
      ></lr-file-uploader-regular>

      <lr-upload-ctx-provider
        ref={ctxProviderRef}
        ctx-name="my-uploader"
      />

      <div className={st.previews}>
        {files.map((file) => (
          <div key={file.uuid} className={st.preview}>
            <img
              className={st.previewImage}
              key={file.uuid}
              src={`${file.cdnUrl}/-/preview/-/resize/x200/`}
              width="100"
              alt={file.fileInfo?.originalFilename || ''}
              title={file.fileInfo?.originalFilename || ''}
            />

            <button
              className={st.previewRemoveButton}
              type="button"
              onClick={() => handleRemoveClick(file.uuid)}
            >×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
