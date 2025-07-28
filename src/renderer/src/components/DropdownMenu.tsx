import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

type Props = {
  onEdit: () => void;
  onDelete: () => void;
};

export const DropdownMenu = ({ onEdit, onDelete }: Props) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="p-2 hover:bg-gray-100 rounded-md transition text-gray-500">
        {/* 縦三点アイコン */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
        </svg>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none z-50">
          <div className="py-1">
            {/* <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => alert('ピン留め')}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                >
                  📌 先頭にピン留めする
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => alert('非表示')}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                >
                  🙈 コメントを非表示にする
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => alert('パーマリンク')}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                >
                  🔗 パーマリンクをコピー
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                >
                  ✏️ 編集
                </button>
              )}
            </Menu.Item> */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onDelete}
                  className={`${
                    active ? 'bg-red-100 text-red-700' : 'text-red-500'
                  } block w-full px-4 py-2 text-left text-sm`}
                >
                  🗑 削除
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default DropdownMenu;
