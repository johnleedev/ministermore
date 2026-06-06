import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface EditorTinymceProps {
  widthProps: string;
  heightProps: string;
  value: string;
  onChange: (value: string) => void;
}

export const EditorTinymce: React.FC<EditorTinymceProps> = ({ widthProps, heightProps, value, onChange }) => {
  const editorRef = useRef<any>(null);

  return (
    <div style={{ width: widthProps, height: heightProps}} className='EditorTinymce'>

      {/* 에디터 */}
      <Editor
        apiKey="ai7ra3v96gya5aj13rvposaswowdh8jcuxq4l99467mq3ee0"
        onInit={(evt: any, editor: any) => (editorRef.current = editor)}
        value={value}
        onEditorChange={(content:any) => {
          if (content.length <= 2000) {
            onChange(content);
          } else {
            alert('최대 2000자 이하로 작성해주세요.');
          }
        }}
        init={{
          width: '100%',
          height: '100%',
          menubar: false,
          plugins: [
            'advlist', 'lists', 'charmap',
            'preview', 'anchor', 'searchreplace', 'visualblocks',
            'fullscreen', 'insertdatetime', 'wordcount', 'fontsize'
          ],
          toolbar:
            'blocks fontsize | bold italic underline forecolor backcolor | fullscreen',
          content_style: 'body { font-size: 14px; outline: none; }',
          automatic_uploads: true,
        }}
      />
    </div>
  );
};
