class ScrapModel {
  // markdownファイルを識別するためのID
  id: number
  // markdownの文章
  content: string
  // スクラップのタイトル
  title: string
  // スクラップの表示順序
  order: number

  constructor(id: number, content: string, title: string = '', order: number = 0) {
    this.id = id
    this.content = content
    this.title = title
    this.order = order
  }

  /**
   * Markdownのテキストを取得する
   */
  getContent(): string {
    return this.content
  }

  /**
   * Markdownのテキストを入力する
   */
  setContent(content: string): void {
    this.content = content
  }

  /**
   * タイトルを取得する
   */
  getTitle(): string {
    return this.title
  }

  /**
   * タイトルを設定する
   */
  setTitle(title: string): void {
    this.title = title
  }

  /**
   * 表示順序を取得する
   */
  getOrder(): number {
    return this.order
  }

  /**
   * 表示順序を設定する
   */
  setOrder(order: number): void {
    this.order = order
  }
}

export default ScrapModel
