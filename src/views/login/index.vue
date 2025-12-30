<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" auto-complete="on" label-position="left">

      <div class="title-container">
        <h3 class="title">Login Form</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="loginForm.username"
          placeholder="Username"
          name="username"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>

      <el-form-item prop="password">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType"
          ref="password"
          v-model="loginForm.password"
          :type="passwordType"
          placeholder="Password"
          name="password"
          tabindex="2"
          auto-complete="on"
          @keyup.enter.native="handleLogin"
        />
        <span class="show-pwd" @click="showPwd">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <!-- 验证码输入区域 -->
      <el-form-item prop="captcha">
        <span class="svg-container">
          <svg-icon icon-class="lock" /> <!-- 可自行添加验证码图标，或替换为其他图标 -->
        </span>
        <el-input
          ref="captcha"
          v-model="loginForm.captcha"
          placeholder="Please enter verification code"
          name="captcha"
          type="text"
          tabindex="3"
          auto-complete="off"
          @keyup.enter.native="handleLogin"
          style="width: 60%;"
        />
        <!-- 验证码图片展示 + 点击刷新 -->
        <div class="captcha-img-container" @click="refreshCaptcha">
          <img :src="captchaImage" alt="Verification Code" class="captcha-img" title="Click to refresh">
        </div>
      </el-form-item>

      <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handleLogin">Login</el-button>

      <!-- <div class="tips">
        <span style="margin-right:20px;">username: admin</span>
        <span> password: any</span>
      </div> -->

    </el-form>
  </div>
</template>

<script>
import { validUsername } from '@/utils/validate'
import { Message } from 'element-ui'
import { getCaptcha } from '@/api/user'

export default {
  name: 'Login',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!validUsername(value)) {
        callback(new Error('Please enter the correct user name'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error('The password can not be less than 6 digits'))
      } else {
        callback()
      }
    }
    // 验证码校验规则
    const validateCaptcha = (rule, value, callback) => {
      if (value.trim() === '') {
        callback(new Error('Please enter the verification code'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: '',
        captcha: '',
        captcha_id: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }],
        captcha: [{ required: true, trigger: 'blur', validator: validateCaptcha }] // 新增：验证码校验规则
      },
      loading: false,
      passwordType: 'password',
      redirect: undefined,
      captchaImage: '' // 存储Base64格式的验证码图片
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  mounted() {
    // 组件挂载后，自动加载验证码
    this.refreshCaptcha()
  },
  methods: {
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    // 获取/刷新验证码
    async refreshCaptcha() {
      try {
        // 清空原有验证码输入
        this.loginForm.captcha_id = ''
        this.loginForm.captcha = ''
        // 请求后端验证码接口（替换为你的实际接口地址）
        // 若项目全局挂载了$http，可使用 this.$http.get
        const { data } = await getCaptcha()
        // 存储验证码ID和Base64图片
        this.loginForm.captcha_id = data.captcha_id
        this.captchaImage = data.captcha_image
        console.log(this.loginForm)
      } catch (error) {
        console.error('获取验证码失败：', error)
        Message({
          message: 'Network error, please try again later',
          type: 'error',
          duration: 3 * 1000
        })
      }
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/login', this.loginForm).then(() => {
            this.$router.push({ path: this.redirect || '/' })
            this.loading = false
          }).catch((errorMsg) => {
            this.loading = false
            // 登录失败后，自动刷新验证码（防止重复使用）
            this.refreshCaptcha()
            Message({
              message: errorMsg,
              type: 'error',
              duration: 5 * 1000
            })
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
    // 调整验证码表单项样式，适配图片展示
    &[prop="captcha"] {
      display: flex;
      align-items: center;
      padding: 0;
      height: 47px;
    }
  }
}
</style>

<style lang="scss" scoped>
$bg:#2d3a4b;
$dark_gray:#889aa4;
$light_gray:#eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  // 验证码图片样式
  .captcha-img-container {
    display: inline-block;
    width: 55%;
    height: 47px;
    margin-left: 5%;
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
  }

  .captcha-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background-color: #fff;
    border-radius: 4px;
  }
}
</style>
