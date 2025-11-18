<template>
  <div
    :style="{zIndex:zIndex,height:height,width:width}"
    class="pan-item"
  >
    <!-- 信息容器：用于包裹所有需要显示的文本和链接 -->
    <div class="pan-info">
      <div class="pan-info-roles-container">
        <!-- 插槽：允许父组件插入自定义内容（如标题、描述、按钮等） -->
        <slot />
      </div>
    </div>

    <!-- 图片容器：显示背景图片，具有旋转动画效果 -->
    <!-- eslint-disable-next-line -->
    <div 
      :style="{backgroundImage: `url(${image})`}"
      class="pan-thumb"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'PanThumb', // 组件名称，用于调试和递归引用

  props: {
    // 背景图片URL（必填）
    image: {
      type: String,
      required: true
    },
    // 组件层级（z-index），默认1
    zIndex: {
      type: Number,
      default: 1
    },
    // 组件宽度，默认150px（支持px、%等单位）
    width: {
      type: String,
      default: '150px'
    },
    // 组件高度，默认150px（支持px、%等单位）
    height: {
      type: String,
      default: '150px'
    }
  }
}
</script>

<style scoped>
/* 组件根容器：圆形样式，相对定位 */
.pan-item {
  width: 200px;
  height: 200px;
  border-radius: 50%; /* 圆形 */
  display: inline-block; /* inline-block布局，允许同行显示 */
  position: relative; /* 作为内部绝对定位元素的参照 */
  cursor: default; /* 默认鼠标样式 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); /* 轻微阴影，增强立体感 */
}

/* 信息容器的内部包裹层：设置内边距和文本居中 */
.pan-info-roles-container {
  padding: 20px;
  text-align: center;
}

/* 图片容器：绝对定位，覆盖整个父容器，具有旋转动画 */
.pan-thumb {
  width: 100%;
  height: 100%;
  background-position: center center; /* 背景图片居中 */
  background-size: cover; /* 背景图片覆盖整个容器 */
  border-radius: 50%; /* 圆形 */
  overflow: hidden; /* 隐藏超出容器的内容 */
  position: absolute; /* 绝对定位，覆盖在信息容器上方 */
  transform-origin: 95% 40%; /* 旋转中心点：距离左95%，距离上40% */
  transition: all 0.3s ease-in-out; /* 所有属性变化添加0.3秒过渡动画 */
}

/* 信息容器：绝对定位，与父容器大小一致，包含文本内容 */
.pan-info {
  position: absolute;
  width: inherit; /* 继承父容器宽度 */
  height: inherit; /* 继承父容器高度 */
  border-radius: 50%; /* 圆形 */
  overflow: hidden; /* 隐藏超出容器的内容 */
  box-shadow: inset 0 0 0 5px rgba(0, 0, 0, 0.05); /* 内部阴影，增强层次感 */
}

/* 信息容器中的标题样式 */
.pan-info h3 {
  color: #fff; /* 白色文字 */
  text-transform: uppercase; /* 文字大写 */
  position: relative; /* 相对定位 */
  letter-spacing: 2px; /* 字间距2px */
  font-size: 18px; /* 字体大小18px */
  margin: 0 60px; /* 左右边距60px */
  padding: 22px 0 0 0; /* 上内边距22px */
  height: 85px; /* 高度85px */
  font-family: 'Open Sans', Arial, sans-serif; /* 字体族 */
  text-shadow: 0 0 1px #fff, 0 1px 2px rgba(0, 0, 0, 0.3); /* 文字阴影，增强可读性 */
}

/* 信息容器中的描述文本样式 */
.pan-info p {
  color: #fff; /* 白色文字 */
  padding: 10px 5px; /* 上下内边距10px，左右5px */
  font-style: italic; /* 斜体 */
  margin: 0 30px; /* 左右边距30px */
  font-size: 12px; /* 字体大小12px */
  border-top: 1px solid rgba(255, 255, 255, 0.5); /* 上边框，半透明白色 */
}

/* 信息容器中的链接按钮样式 */
.pan-info p a {
  display: block; /* 块级元素 */
  color: #333; /* 深色文字 */
  width: 80px; /* 宽度80px */
  height: 80px; /* 高度80px */
  background: rgba(255, 255, 255, 0.3); /* 半透明白色背景 */
  border-radius: 50%; /* 圆形 */
  color: #fff; /* 白色文字 */
  font-style: normal; /* 正常字体样式（覆盖父级的斜体） */
  font-weight: 700; /* 加粗 */
  text-transform: uppercase; /* 文字大写 */
  font-size: 9px; /* 字体大小9px */
  letter-spacing: 1px; /* 字间距1px */
  padding-top: 24px; /* 上内边距24px，使文字垂直居中 */
  margin: 7px auto 0; /* 上下外边距7px，左右自动（水平居中） */
  font-family: 'Open Sans', Arial, sans-serif; /* 字体族 */
  opacity: 0; /* 默认透明（隐藏） */
  /* 过渡动画：transform和opacity 0.3秒 ease-in-out 延迟0.2秒；background 0.2秒 linear */
  transition: transform 0.3s ease-in-out 0.2s, opacity 0.3s ease-in-out 0.2s, background 0.2s linear 0s;
  transform: translateX(60px) rotate(90deg); /* 默认状态：向右偏移60px并旋转90度（隐藏） */
}

/* 链接按钮 hover 状态 */
.pan-info p a:hover {
  background: rgba(255, 255, 255, 0.5); /* 背景透明度增加到50% */
}

/* 父容器 hover 时，图片容器的样式变化 */
.pan-item:hover .pan-thumb {
  transform: rotate(-110deg); /* 逆时针旋转110度，露出下方的信息容器 */
}

/* 父容器 hover 时，链接按钮的样式变化 */
.pan-item:hover .pan-info p a {
  opacity: 1; /* 不透明（显示） */
  transform: translateX(0px) rotate(0deg); /* 恢复到原始位置（不偏移、不旋转） */
}
</style>
